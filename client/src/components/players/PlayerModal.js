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
  const [activeTab, setActiveTab] = useState('overview');
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
      setActiveTab('overview');
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
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Hero Header */}
        <div className="player-hero-header">
          <div className="player-hero-background">
            <div className="hero-pattern"></div>
          </div>
          <div className="player-hero-content">
            <div className="player-avatar">
              <div className="avatar-ring">
                <span className="avatar-icon" style={{ color: roleInfo.color }}>
                  {roleInfo.icon}
                </span>
              </div>
              {player.is_mvp && <div className="mvp-crown">👑</div>}
            </div>
            <div className="player-hero-info">
              <h2 className="player-name">{player.name}</h2>
              <div className="player-badges">
                <span className={`role-badge ${formData.role}`} style={{ backgroundColor: roleInfo.color }}>
                  {roleInfo.icon} {roleInfo.label}
                </span>
                {formData.is_on_holidays && (
                  <span className="status-badge holiday">🏖️ On Holidays</span>
                )}
              {player.is_mvp && (
                <span className="status-badge mvp">👑 MVP</span>
              )}
              </div>
            </div>
          </div>
          <div className="hero-actions">
            <button 
              className="hero-save-btn" 
              onClick={handleSavePlayer}
              disabled={loading || !formData.name}
              title="Save Changes"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17,21 17,13 7,13 7,21"></polyline>
                  <polyline points="7,3 7,8 15,8"></polyline>
                </svg>
              )}
            </button>
            <button className="hero-close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="player-nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit
          </button>
          <button 
            className={`nav-tab ${activeTab === 'crown' ? 'active' : ''}`}
            onClick={() => setActiveTab('crown')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h12l4 6-10 13L2 9l4-6z"></path>
              <path d="M11 3L8 9l4 13 4-13-3-6"></path>
              <path d="M2 9h20"></path>
            </svg>
            Crown
          </button>
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={handleViewHistory}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            History
          </button>
          <button 
            className={`nav-tab danger ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
            </svg>
            Delete
          </button>
        </div>

        {/* Content Area */}
        <div className="player-modal-content">
          {error && (
            <div className="notification error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span>{error}</span>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          {message && (
            <div className="notification success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              <span>{message}</span>
              <button onClick={() => setMessage('')}>×</button>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-panel overview-panel">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⚔️</div>
                  <div className="stat-info">
                    <div className="stat-label">Role</div>
                    <div className="stat-value">{roleInfo.label}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <div className="stat-label">Joined</div>
                    <div className="stat-value">{new Date(player.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏖️</div>
                  <div className="stat-info">
                    <div className="stat-label">Availability</div>
                    <div className="stat-value">{formData.is_on_holidays ? 'On Holiday' : 'Active'}</div>
                  </div>
                </div>
              </div>
              
              {formData.description && (
                <div className="description-card">
                  <h4>📜 Description</h4>
                  <p>{formData.description}</p>
                </div>
              )}

              <div className="quick-actions">
                <button 
                  className="action-btn edit-btn"
                  onClick={() => setActiveTab('edit')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Warrior
                </button>
                <button 
                  className="action-btn crown-btn"
                  onClick={() => setActiveTab('crown')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3h12l4 6-10 13L2 9l4-6z"></path>
                  </svg>
                  Assign MVP
                </button>
              </div>
            </div>
          )}

          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div className="tab-panel edit-panel">
              <div className="form-section">
                <div className="input-group">
                  <label className="input-label">
                    Warrior Name
                    <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Enter warrior name"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Description</label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Add a description..."
                      rows="3"
                      className="form-textarea"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Role</label>
                  <div className="role-selector">
                    {roles.map(role => (
                      <button
                        key={role.value}
                        type="button"
                        className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                        onClick={() => setFormData({...formData, role: role.value})}
                        disabled={loading}
                        style={{ '--role-color': role.color }}
                      >
                        <span className="role-icon">{role.icon}</span>
                        <span className="role-name">{role.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      name="is_on_holidays"
                      checked={formData.is_on_holidays}
                      onChange={handleChange}
                      disabled={loading}
                      className="toggle-input"
                    />
                    <div className="toggle-switch">
                      <div className="toggle-slider"></div>
                    </div>
                    <div className="toggle-content">
                      <span className="toggle-title">🏖️ Holiday Mode</span>
                      <span className="toggle-description">Mark this warrior as temporarily unavailable</span>
                    </div>
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleSavePlayer}
                    disabled={loading || !formData.name}
                    className="save-btn"
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17,21 17,13 7,13 7,21"></polyline>
                          <polyline points="7,3 7,8 15,8"></polyline>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Crown Tab */}
          {activeTab === 'crown' && (
            <div className="tab-panel crown-panel">
              <div className="crown-header">
                <div className="crown-icon">👑</div>
                <h3>Assign as MVP</h3>
                <p>Select a battle to assign {player.name} as MVP</p>
              </div>

              {events.length === 0 ? (
                <div className="empty-crown-state">
                  <div className="empty-icon">⚔️</div>
                  <h4>No Battles Available</h4>
                  <p>Create a battle event first to assign MVP</p>
                </div>
              ) : (
                <div className="events-selection">
                  <div className="events-grid">
                    {events.map(event => (
                      <div
                        key={event.id}
                        className={`event-card ${selectedEventId === event.id ? 'selected' : ''}`}
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <div className="event-icon">⚔️</div>
                        <div className="event-info">
                          <h4>{event.name}</h4>
                          <p>{new Date(event.date || event.created_at).toLocaleDateString()}</p>
                        </div>
                        {selectedEventId === event.id && (
                          <div className="selection-indicator">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="crown-actions">
                    <button
                      onClick={handleAssignMVP}
                      disabled={loading || !selectedEventId}
                      className="crown-btn-action"
                    >
                      {loading ? (
                        <>
                          <div className="spinner"></div>
                          Crowning...
                        </>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 3h12l4 6-10 13L2 9l4-6z"></path>
                          </svg>
                          Assign as MVP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="tab-panel history-panel">
              <div className="history-header">
                <div className="history-icon">📜</div>
                <h3>Battle History</h3>
                <p>Victories and achievements of {player.name}</p>
              </div>

              {historyLoading ? (
                <div className="loading-history">
                  <div className="spinner large"></div>
                  <p>Loading battle history...</p>
                </div>
              ) : playerHistory.length === 0 ? (
                <div className="empty-history-state">
                  <div className="empty-icon">⚔️</div>
                  <h4>No Victories Yet</h4>
                  <p>This warrior hasn't been crowned as champion in any battles yet</p>
                </div>
              ) : (
                <div className="history-timeline">
                  {playerHistory.map((entry, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="timeline-icon">👑</div>
                      </div>
                      <div className="timeline-content">
                        <div className="victory-card">
                          <div className="victory-header">
                            <h4>{entry.event_name}</h4>
                            <span className="victory-badge">Champion</span>
                          </div>
                          <div className="victory-date">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {new Date(entry.assigned_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Danger Tab */}
          {activeTab === 'danger' && (
            <div className="tab-panel danger-panel">
              <div className="danger-header">
                <div className="danger-icon">⚠️</div>
                <h3>Delete Warrior</h3>
                <p>This action cannot be undone. The warrior will be permanently removed.</p>
              </div>

              <div className="danger-warning">
                <div className="warning-card">
                  <div className="warning-icon-large">🗑️</div>
                  <div className="warning-content">
                    <h4>Are you absolutely sure?</h4>
                    <p>Deleting <strong>{player.name}</strong> will permanently:</p>
                    <div className="consequences-list">
                      <div className="consequence-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Remove them from all battles
                      </div>
                      <div className="consequence-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Delete their battle history
                      </div>
                      <div className="consequence-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Remove their champion status
                      </div>
                      <div className="consequence-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        This action cannot be undone
                      </div>
                    </div>
                  </div>
                </div>

                <div className="danger-actions">
                  <button
                    onClick={handleDeletePlayer}
                    disabled={loading}
                    className="delete-btn"
                  >
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                        </svg>
                        Delete Warrior
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerModal;