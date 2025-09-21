import React, { useState } from 'react';
import api from '../../config/axios';
import './FeedbackModal.css';

const FeedbackModal = ({ feedback, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: feedback.status || 'new',
    adminNotes: feedback.admin_notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/api/feedback/${feedback.id}/status`, formData);
      onSave();
    } catch (err) {
      setError('Failed to update feedback');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#007bff';
      case 'in_progress': return '#ffc107';
      case 'resolved': return '#28a745';
      case 'closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'bug': return '#dc3545';
      case 'feature': return '#17a2b8';
      case 'improvement': return '#28a745';
      case 'general': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Feedback Details</h2>
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

        <div className="feedback-details">
          <div className="feedback-meta">
            <div className="meta-item">
              <span className="meta-label">Type:</span>
              <span 
                className="feedback-type-badge"
                style={{ backgroundColor: getTypeColor(feedback.feedback_type) }}
              >
                {feedback.feedback_type}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(feedback.status) }}
              >
                {feedback.status}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Date:</span>
              <span className="meta-value">
                {new Date(feedback.created_at).toLocaleString()}
              </span>
            </div>
            {feedback.donation_amount && (
              <div className="meta-item">
                <span className="meta-label">Donation:</span>
                <span className="meta-value donation-amount">
                  ${feedback.donation_amount}
                </span>
              </div>
            )}
          </div>

          <div className="feedback-content">
            <div className="content-section">
              <h3>From:</h3>
              <p>{feedback.name || 'Anonymous'}</p>
            </div>

            {feedback.subject && (
              <div className="content-section">
                <h3>Subject:</h3>
                <p>{feedback.subject}</p>
              </div>
            )}

            <div className="content-section">
              <h3>Message:</h3>
              <div className="message-content">
                {feedback.message}
              </div>
            </div>

            {feedback.admin_notes && (
              <div className="content-section">
                <h3>Admin Notes:</h3>
                <div className="admin-notes">
                  {feedback.admin_notes}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Update Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="adminNotes" className="form-label">
                Admin Notes
              </label>
              <textarea
                id="adminNotes"
                name="adminNotes"
                value={formData.adminNotes}
                onChange={handleChange}
                className="form-control"
                rows="4"
                disabled={loading}
                placeholder="Add notes about this feedback..."
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Close
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
