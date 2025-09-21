import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import './AllianceModal.css';

const AllianceModal = ({ alliance, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (alliance) {
      setFormData({
        name: alliance.name
      });
    }
  }, [alliance]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (alliance) {
        // Update existing alliance
        await api.put(`/api/alliances/${alliance.id}`, formData);
      } else {
        // Create new alliance
        await api.post('/api/alliances', formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save alliance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {alliance ? 'Edit Alliance' : 'Add New Alliance'}
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
            <label htmlFor="name" className="form-label">
              Alliance Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
              disabled={loading}
              placeholder="Enter alliance name"
            />
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
              {loading ? 'Saving...' : (alliance ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllianceModal;
