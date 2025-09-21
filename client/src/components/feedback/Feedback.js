import React, { useState } from 'react';
import api from '../../config/axios';
import './Feedback.css';

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    feedbackType: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
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

    // Validation
    if (!formData.message.trim()) {
      setError('Please provide your feedback message');
      setLoading(false);
      return;
    }

    if (formData.feedbackType === 'bug' && !formData.subject.trim()) {
      setError('Please provide a subject for bug reports');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting feedback:', formData);
      const response = await api.post('/api/feedback', formData);
      console.log('Feedback response:', response);
      setMessage('Thank you for your feedback! We appreciate your input.');
      setFormData({
        name: '',
        subject: '',
        message: '',
        feedbackType: 'general'
      });
    } catch (err) {
      console.error('Feedback submission error:', err);
      console.error('Error response:', err.response);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Royal Council</h1>
          <p className="page-subtitle">Share your wisdom to help us forge a better kingdom management experience</p>
        </div>

        {message && (
          <div className="alert alert-success animate-slide-down">
            <span>🎉 {message}</span>
            <button 
              type="button" 
              className="alert-close"
              onClick={() => setMessage('')}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-danger animate-slide-down">
            <span>⚠️ {error}</span>
            <button 
              type="button" 
              className="alert-close"
              onClick={() => setError('')}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        <div className="feedback-container">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Council Chambers</h2>
              <p className="card-subtitle">Your royal decree helps us improve the kingdom's management</p>
            </div>

          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="feedbackType" className="form-label">
                  Council Matter
                </label>
                <select
                  id="feedbackType"
                  name="feedbackType"
                  value={formData.feedbackType}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading}
                >
                  <option value="general">General Royal Decree</option>
                  <option value="bug">Report Kingdom Issue</option>
                  <option value="feature">Request New Feature</option>
                  <option value="improvement">Suggest Enhancement</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject" className="form-label">
                  Royal Subject {formData.feedbackType === 'bug' && <span className="required">*</span>}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="form-control"
                  disabled={loading}
                  placeholder="Brief summary of your royal decree"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Royal Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                disabled={loading}
                placeholder="Your royal title or name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label">
                Royal Decree <span className="required">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="form-control"
                rows="6"
                disabled={loading}
                placeholder="Share your wisdom and detailed thoughts to help us improve the kingdom..."
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.message.trim()}
              >
                {loading && <div className="loading-spinner"></div>}
                {loading ? 'Sending Royal Decree...' : '📜 Submit Royal Decree'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Feedback;
