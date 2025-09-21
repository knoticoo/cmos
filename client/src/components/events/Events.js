import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import './Events.css';

// Inline Edit Form Component
const EventEditForm = ({ event, onSave, onCancel }) => {
  const [editData, setEditData] = useState({ name: event.name, description: event.description || '' });

  const handleSave = () => {
    onSave(event.id, editData);
  };

  return (
    <div className="event-edit-form">
      <div className="form-header">
        <h4>✏️ Edit Battle</h4>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
      </div>
      <div className="form-body">
        <div className="form-group">
          <label>Battle Name:</label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            placeholder="Enter battle name..."
          />
        </div>
        <div className="form-group">
          <label>Battle Description:</label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            placeholder="Describe this epic battle..."
            rows="3"
          />
        </div>
        <div className="form-actions">
          <button 
            onClick={handleSave} 
            className="btn btn-primary"
            disabled={!editData.name}
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingEventId, setEditingEventId] = useState(null);
  const [newEvent, setNewEvent] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/events');
      setEvents(response.data.events);
    } catch (err) {
      setError('Failed to load events');
      console.error('Events error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setShowAddForm(true);
    setNewEvent({ name: '', description: '' });
  };

  const handleEditEvent = (eventId) => {
    setEditingEventId(eventId);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setShowAddForm(false);
    setNewEvent({ name: '', description: '' });
  };

  const handleSaveEvent = async (eventId, eventData) => {
    try {
      await api.put(`/api/events/${eventId}`, eventData);
      setMessage('Battle updated successfully! ⚔️');
      setEditingEventId(null);
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update battle');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCreateEvent = async () => {
    try {
      await api.post('/api/events', newEvent);
      setMessage('New battle created successfully! ⚔️');
      setShowAddForm(false);
      setNewEvent({ name: '', description: '' });
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Create error:', err);
      setError(err.response?.data?.error || 'Failed to create battle');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this battle?')) {
      try {
        await api.delete(`/api/events/${id}`);
        setMessage('Battle deleted successfully! ⚔️');
        await fetchData();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete battle');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="events">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Epic Battles</h1>
          <p className="page-subtitle">Orchestrate legendary conflicts and crown your champions</p>
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

        {/* Stats Section */}
        <div className="events-stats">
          <div className="stat-card">
            <span className="stat-icon">⚡</span>
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">Active Events</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="events-action-bar">
          <h2>Battle Registry</h2>
          <button 
            onClick={handleAddEvent}
            className="btn btn-primary"
          >
            Create Epic Battle
          </button>
        </div>

        {/* Add New Event Form */}
        {showAddForm && (
          <div className="event-form-card">
            <div className="form-header">
              <h3>⚔️ Create Epic Battle</h3>
              <button onClick={handleCancelEdit} className="btn btn-ghost">
                Cancel
              </button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label>Battle Name:</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  placeholder="Enter battle name..."
                />
              </div>
              <div className="form-group">
                <label>Battle Description:</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Describe this epic battle..."
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button 
                  onClick={handleCreateEvent} 
                  className="btn btn-primary"
                  disabled={!newEvent.name}
                >
                  ⚔️ Create Battle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 && !showAddForm ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚔️</div>
            <h3 className="empty-state-title">No Battles Yet</h3>
            <p className="empty-state-text">Create your first epic battle to begin the conquest</p>
            <button 
              onClick={handleAddEvent}
              className="btn btn-primary"
            >
              ⚡ Create First Battle
            </button>
          </div>
        ) : events.length > 0 ? (
          <div className="events-simple-list">
            {events.map(event => (
              <div key={event.id} className="event-simple-card">
                {editingEventId === event.id ? (
                  <EventEditForm 
                    event={event}
                    onSave={handleSaveEvent}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <div className="event-simple-content">
                    <div className="event-simple-header">
                      <h3 className="event-simple-title">⚔️ {event.name}</h3>
                      <div className="event-simple-actions">
                        <button
                          onClick={() => handleEditEvent(event.id)}
                          className="btn btn-sm btn-secondary"
                          title="Edit battle"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="btn btn-sm btn-danger"
                          title="Delete battle"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="event-simple-body">
                      <div className="event-simple-date">
                        📅 Created: {new Date(event.created_at).toLocaleDateString()}
                      </div>
                      {event.description && (
                        <div className="event-simple-description">
                          📜 {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Events;
