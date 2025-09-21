import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import AllianceAssignmentModal from './AllianceAssignmentModal';
import './Alliances.css';

// Inline Edit Form Component
const AllianceEditForm = ({ alliance, onSave, onCancel }) => {
  const [editData, setEditData] = useState({ name: alliance.name, description: alliance.description || '' });

  const handleSave = () => {
    onSave(alliance.id, editData);
  };

  return (
    <div className="alliance-edit-form">
      <div className="form-header">
        <h4>✏️ Edit Alliance</h4>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
      </div>
      <div className="form-body">
        <div className="form-group">
          <label>Alliance Name:</label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            placeholder="Enter alliance name..."
          />
        </div>
        <div className="form-group">
          <label>Alliance Description:</label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            placeholder="Describe this alliance..."
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

const Alliances = () => {
  const [alliances, setAlliances] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingAllianceId, setEditingAllianceId] = useState(null);
  const [newAlliance, setNewAlliance] = useState({ name: '', description: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedAlliance, setSelectedAlliance] = useState(null);
  const [newlyWonAllianceId, setNewlyWonAllianceId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alliancesRes, eventsRes] = await Promise.all([
        api.get('/api/alliances'),
        api.get('/api/events')
      ]);
      setAlliances(alliancesRes.data.alliances);
      setEvents(eventsRes.data.events);
    } catch (err) {
      setError('Failed to load data');
      console.error('Alliances error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlliance = () => {
    setShowAddForm(true);
    setNewAlliance({ name: '', description: '' });
  };

  const handleEditAlliance = (allianceId) => {
    setEditingAllianceId(allianceId);
  };

  const handleCancelEdit = () => {
    setEditingAllianceId(null);
    setShowAddForm(false);
    setNewAlliance({ name: '', description: '' });
  };

  const handleSaveAlliance = async (allianceId, allianceData) => {
    try {
      await api.put(`/api/alliances/${allianceId}`, allianceData);
      setMessage('Alliance updated successfully! 🏰');
      setEditingAllianceId(null);
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update alliance');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCreateAlliance = async () => {
    try {
      await api.post('/api/alliances', newAlliance);
      setMessage('New alliance forged successfully! 🤝');
      setShowAddForm(false);
      setNewAlliance({ name: '', description: '' });
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Create error:', err);
      setError(err.response?.data?.error || 'Failed to forge alliance');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteAlliance = async (id) => {
    if (window.confirm('Are you sure you want to dissolve this alliance?')) {
      try {
        await api.delete(`/api/alliances/${id}`);
        setMessage('Alliance dissolved successfully! 🏰');
        await fetchData();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setError('Failed to dissolve alliance');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const handleAssignAllianceToEvent = async (allianceId, eventId) => {
    try {
      console.log('Assigning alliance to event:', { 
        allianceId, 
        eventId, 
        allianceIdType: typeof allianceId, 
        eventIdType: typeof eventId 
      });
      
      // Convert to integers to ensure proper format
      const requestData = { 
        allianceId: parseInt(allianceId), 
        eventId: parseInt(eventId) 
      };
      
      console.log('Sending request data:', requestData);
      
      const response = await api.post(`/api/events/${eventId}/alliances`, { allianceId: parseInt(allianceId) });
      console.log('Alliance assignment response:', response.data);
      setMessage('Alliance deployed to battle successfully! ⚔️');
      
      // Trigger trophy animation for the winning alliance
      setNewlyWonAllianceId(parseInt(allianceId));
      setTimeout(() => setNewlyWonAllianceId(null), 2000); // Reset after animation
      
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Alliance assignment error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      setError(`Failed to deploy alliance to battle: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleBlacklist = async (allianceId, isBlacklisted) => {
    try {
      console.log('Toggling blacklist:', { allianceId, isBlacklisted });
      
      // Test the PATCH method first
      try {
        const testResponse = await api.patch('/api/alliances/test');
        console.log('PATCH test response:', testResponse.data);
      } catch (testErr) {
        console.error('PATCH test failed:', testErr);
      }
      
      const response = await api.patch(`/api/alliances/${allianceId}/blacklist`, { isBlacklisted });
      console.log('Blacklist response:', response.data);
      setMessage(isBlacklisted ? 'Alliance blacklisted successfully! 🚫' : 'Alliance removed from blacklist! ✅');
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Blacklist error:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      setError(`Failed to update blacklist status: ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleOpenAssignmentModal = (alliance) => {
    setSelectedAlliance(alliance);
    setAssignmentModalOpen(true);
  };

  const handleCloseAssignmentModal = () => {
    setAssignmentModalOpen(false);
    setSelectedAlliance(null);
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading alliances...</p>
      </div>
    );
  }

  return (
    <div className="alliances">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Kingdom Alliances</h1>
          <p className="page-subtitle">Forge powerful bonds and unite kingdoms for greater strength</p>
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
        <div className="alliances-stats">
          <div className="stat-card">
            <span className="stat-icon">🏰</span>
            <span className="stat-number">{alliances.length}</span>
            <span className="stat-label">Total Alliances</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">✅</span>
            <span className="stat-number">{alliances.filter(a => !a.is_blacklisted).length}</span>
            <span className="stat-label">Active Alliances</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🚫</span>
            <span className="stat-number">{alliances.filter(a => a.is_blacklisted).length}</span>
            <span className="stat-label">Blacklisted</span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="alliances-action-bar">
          <h2>Alliance Registry</h2>
          <button 
            onClick={handleAddAlliance}
            className="btn btn-primary"
          >
            Forge New Alliance
          </button>
        </div>

        {/* Add New Alliance Form */}
        {showAddForm && (
          <div className="alliance-form-card">
            <div className="form-header">
              <h3>🏰 Forge New Alliance</h3>
              <button onClick={handleCancelEdit} className="btn btn-ghost">
                Cancel
              </button>
            </div>
            <div className="form-body">
              <div className="form-group">
                <label>Alliance Name:</label>
                <input
                  type="text"
                  value={newAlliance.name}
                  onChange={(e) => setNewAlliance({...newAlliance, name: e.target.value})}
                  placeholder="Enter alliance name..."
                />
              </div>
              <div className="form-group">
                <label>Alliance Description:</label>
                <textarea
                  value={newAlliance.description}
                  onChange={(e) => setNewAlliance({...newAlliance, description: e.target.value})}
                  placeholder="Describe this alliance..."
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button 
                  onClick={handleCreateAlliance} 
                  className="btn btn-primary"
                  disabled={!newAlliance.name}
                >
                  🤝 Forge Alliance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alliances List */}
        {alliances.length === 0 && !showAddForm ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏰</div>
            <h3 className="empty-state-title">No Alliances Yet</h3>
            <p className="empty-state-text">Forge your first alliance to strengthen your kingdom and unite with others</p>
            <button 
              onClick={handleAddAlliance}
              className="btn btn-primary"
            >
              🤝 Forge First Alliance
            </button>
          </div>
        ) : alliances.length > 0 ? (
          <div className="alliances-list">
            {alliances.map(alliance => (
              <div key={alliance.id} className={`alliance-item ${alliance.event_name ? 'has-victories' : ''} ${alliance.is_blacklisted ? 'blacklisted' : ''}`}>
                {editingAllianceId === alliance.id ? (
                  <AllianceEditForm 
                    alliance={alliance}
                    onSave={handleSaveAlliance}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    <div className="alliance-main">
                      <div className="alliance-info">
                        <h3 className="alliance-name">
                          {alliance.name}
                          {alliance.event_name && (
                            <span 
                              className={`victory-indicator ${newlyWonAllianceId === alliance.id ? 'trophy-animate' : ''}`}
                            >
                              🏆
                            </span>
                          )}
                          {alliance.is_blacklisted && <span className="blacklist-indicator">🚫</span>}
                        </h3>
                        <div className="alliance-details">
                          <span className="alliance-date">📅 Forged: {new Date(alliance.created_at).toLocaleDateString()}</span>
                          <span className="alliance-victories">
                            🏆 Victories: {alliance.event_name ? '1+' : '0'}
                          </span>
                          {alliance.event_name && (
                            <span className="alliance-battle">
                              ⚔️ Victory in: {alliance.event_name}
                            </span>
                          )}
                          {alliance.is_blacklisted && (
                            <span className="alliance-blacklist-status">
                              🚫 Blacklisted
                            </span>
                          )}
                        </div>
                        {alliance.description && (
                          <div className="alliance-description">
                            📜 {alliance.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="alliance-actions">
                        <button
                          onClick={() => handleEditAlliance(alliance.id)}
                          className="btn btn-sm btn-secondary"
                          title="Edit alliance"
                        >
                          ✏️
                        </button>
                        
                        {!alliance.is_blacklisted && (
                          <button
                            onClick={() => handleOpenAssignmentModal(alliance)}
                            className="btn btn-sm btn-success"
                            title="Deploy to battle"
                          >
                            🚀
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleBlacklist(alliance.id, !alliance.is_blacklisted)}
                          className={`btn btn-sm ${alliance.is_blacklisted ? 'btn-warning' : 'btn-outline-warning'}`}
                          title={alliance.is_blacklisted ? 'Remove from blacklist' : 'Add to blacklist'}
                        >
                          {alliance.is_blacklisted ? '✅' : '🚫'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteAlliance(alliance.id)}
                          className="btn btn-sm btn-danger"
                          title="Dissolve alliance"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Alliance Assignment Modal */}
        <AllianceAssignmentModal
          isOpen={assignmentModalOpen}
          onClose={handleCloseAssignmentModal}
          events={events}
          alliance={selectedAlliance}
          onAssignAlliance={handleAssignAllianceToEvent}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Alliances;
