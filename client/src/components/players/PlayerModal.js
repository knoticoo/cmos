import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import './PlayerModal.css';

const PlayerModal = ({ 
  isOpen, 
  onClose, 
  player, 
  events = [], 
  onPlayerUpdate, 
  onPlayerDelete, 
  onAssignMVP 
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'normal',
    is_on_holidays: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [playerHistory, setPlayerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');

  const roles = [
    { value: 'leader', label: 'Leader', icon: '👑', color: '#FFD700' },
    { value: 'co-leader', label: 'Co-Leader', icon: '⭐', color: '#C0C0C0' },
    { value: 'elite', label: 'Elite', icon: '💎', color: '#9B59B6' },
    { value: 'normal', label: 'Normal', icon: '⚔️', color: '#3498DB' }
  ];

  useEffect(() => {
    if (player && isOpen) {
      setFormData({
        name: player.name || '',
        description: player.description || '',
        role: player.role || 'normal',
        is_on_holidays: player.is_on_holidays || false
      });
      setActiveTab('info');
      setError('');
      setMessage('');
    }
  }, [player, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData({
      ...formData,
      [name]: newValue
    });
    setError('');
  };

  const handleSavePlayer = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.put(`/api/players/${player.id}`, formData);
      setMessage('Player updated successfully! ⚔️');
      
      // Update the form data to reflect the changes immediately
      setFormData(prevData => ({ ...prevData, ...formData }));
      
      // Don't call onPlayerUpdate immediately to prevent modal relaunch
      // The changes will be visible when the modal is closed and reopened
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (window.confirm(`Are you sure you want to delete ${player.name}? This action cannot be undone.`)) {
      setLoading(true);
      setError('');

      try {
        await api.delete(`/api/players/${player.id}`);
        setMessage('Player deleted successfully! 🗑️');
        onPlayerDelete();
        setTimeout(() => {
          setMessage('');
          onClose();
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete player');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignMVP = async () => {
    if (!selectedEventId) {
      setError('Please select an event to assign MVP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post(`/api/players/${player.id}/mvp`, { eventId: selectedEventId });
      setMessage('Champion crowned successfully! 👑');
      onAssignMVP();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('Failed to crown champion: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async () => {
    setHistoryLoading(true);
    setError('');

    try {
      const response = await api.get(`/api/players/${player.id}/mvp-history`);
      setPlayerHistory(response.data.history || []);
      setActiveTab('history');
    } catch (err) {
      setError('Failed to load battle history: ' + (err.response?.data?.message || err.message));
    } finally {
      setHistoryLoading(false);
    }
  };

  const getRoleInfo = (roleValue) => {
    return roles.find(role => role.value === roleValue) || roles[3]; // Default to normal
  };

  if (!isOpen || !player) return null;

  const roleInfo = getRoleInfo(formData.role);

  return (
    <div className="modal-overlay player-modal" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="player-header-info">
            <h3 className="modal-title">
              <span className="player-role-icon" style={{ color: roleInfo.color }}>
                {roleInfo.icon}
              </span>
              {player.name}
            </h3>
            <div className="player-status">
              <span className={`role-badge ${formData.role}`} style={{ backgroundColor: roleInfo.color }}>
                {roleInfo.label}
              </span>
              {formData.is_on_holidays && (
                <span className="holiday-badge">🏖️ On Holidays</span>
              )}
              {player.is_mvp && (
                <span className="mvp-badge">👑 MVP</span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-danger">
              {error}
              <button type="button" className="alert-close" onClick={() => setError('')}>×</button>
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              {message}
              <button type="button" className="alert-close" onClick={() => setMessage('')}>×</button>
            </div>
          )}

          <div className="modal-tabs">
            <button 
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              📝 Player Info
            </button>
            <button 
              className={`tab-button ${activeTab === 'mvp' ? 'active' : ''}`}
              onClick={() => setActiveTab('mvp')}
            >
              👑 Assign MVP
            </button>
            <button 
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={handleViewHistory}
            >
              📋 Battle History
            </button>
            <button 
              className={`tab-button ${activeTab === 'danger' ? 'active' : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              🗑️ Delete Player
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'info' && (
              <div className="info-section">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Warrior Name <span className="required">*</span>
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
                    placeholder="Enter warrior name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-control"
                    disabled={loading}
                    placeholder="Add a description (e.g., 'On vacation until next week', 'Expert in PvP battles')"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role" className="form-label">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="form-control"
                    disabled={loading}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_on_holidays"
                      checked={formData.is_on_holidays}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span className="checkbox-text">🏖️ On Holidays</span>
                  </label>
                </div>


                <div className="form-actions">
                  <button
                    onClick={handleSavePlayer}
                    className="btn btn-primary"
                    disabled={loading || !formData.name}
                  >
                    {loading ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'mvp' && (
              <div className="mvp-section">
                <div className="section-header">
                  <h4>👑 Crown as Champion</h4>
                  <p>Select an event to assign this warrior as MVP</p>
                </div>

                <div className="form-group">
                  <label htmlFor="eventSelect" className="form-label">
                    Select Event <span className="required">*</span>
                  </label>
                  <select
                    id="eventSelect"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="form-control"
                    disabled={loading}
                  >
                    <option value="">Choose an event...</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {new Date(event.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                {events.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">⚔️</div>
                    <p>No events available. Create an event first to assign MVP.</p>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    onClick={handleAssignMVP}
                    className="btn btn-primary"
                    disabled={loading || !selectedEventId}
                  >
                    {loading ? 'Crowning...' : '👑 Crown as Champion'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-section">
                <div className="section-header">
                  <h4>📋 Battle History</h4>
                  <p>Victories and achievements of this warrior</p>
                </div>

                {historyLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading battle history...</p>
                  </div>
                ) : playerHistory.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p>No victories yet. This warrior hasn't been crowned as champion in any events.</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {playerHistory.map((entry, index) => (
                      <div key={index} className="history-item">
                        <div className="history-content">
                          <div className="history-event">
                            <div className="event-icon">⚔️</div>
                            <div className="event-info">
                              <div className="event-name">{entry.event_name}</div>
                              <div className="event-date">
                                📅 {new Date(entry.assigned_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="history-badge">
                            <span className="victory-badge">👑 Victory</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="danger-section">
                <div className="section-header">
                  <h4>🗑️ Delete Player</h4>
                  <p>This action cannot be undone. The player will be permanently removed from your army.</p>
                </div>

                <div className="warning-box">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <h5>Are you absolutely sure?</h5>
                    <p>Deleting <strong>{player.name}</strong> will:</p>
                    <ul>
                      <li>Remove them from all events</li>
                      <li>Delete their battle history</li>
                      <li>Remove their MVP status</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    onClick={handleDeletePlayer}
                    className="btn btn-danger"
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : '🗑️ Delete Player'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;