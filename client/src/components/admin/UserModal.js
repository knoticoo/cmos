import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import './UserModal.css';

const UserModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        isAdmin: user.is_admin
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading) {
      return;
    }
    
    setLoading(true);
    setError('');

    // Validation
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!user && !formData.password.trim()) {
      setError('Password is required for new users');
      setLoading(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (user) {
        // Update existing user
        const updateData = {
          username: formData.username,
          isAdmin: formData.isAdmin
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await api.put(`/api/auth/users/${user.id}`, updateData);
      } else {
        // Create new user
        await api.post('/api/auth/register', {
          username: formData.username,
          password: formData.password,
          isAdmin: formData.isAdmin
        });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button 
            type="button" 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password {user && <span className="optional">(leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              disabled={loading}
              placeholder={user ? "Enter new password (optional)" : "Enter password"}
              required={!user}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
                disabled={loading}
                className="checkbox-input"
              />
              <span className="checkbox-text">Administrator privileges</span>
            </label>
            <p className="checkbox-help">
              Administrators can manage users and access all features
            </p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
