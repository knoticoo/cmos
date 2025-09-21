import React, { useState, useEffect } from 'react';
import api from '../../config/axios';
import './Players.css';
import MVPModal from './MVPModal';
import PlayerModal from './PlayerModal';

// Inline Edit Form Component
const PlayerEditForm = ({ player, onSave, onCancel }) => {
  const [editData, setEditData] = useState({ name: player.name });

  const handleSave = () => {
    onSave(player.id, editData);
  };

  return (
    <div className="player-edit-form">
      <div className="form-header">
        <h4>✏️ Edit Warrior</h4>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
      </div>
      <div className="form-body">
        <div className="form-group">
          <label>Warrior Name:</label>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            placeholder="Enter warrior name..."
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

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [newPlayer, setNewPlayer] = useState({ name: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [playerHistories, setPlayerHistories] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});
  const [mvpModalOpen, setMvpModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [playersRes, eventsRes] = await Promise.all([
        api.get('/api/players'),
        api.get('/api/events')
      ]);
      setPlayers(playersRes.data.players);
      setEvents(eventsRes.data.events);
    } catch (err) {
      setError('Failed to load data');
      console.error('Data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = () => {
    setShowAddForm(true);
    setNewPlayer({ name: '' });
  };

  const handleEditPlayer = (playerId) => {
    setEditingPlayerId(playerId);
  };

  const handleDeletePlayer = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await api.delete(`/api/players/${id}`);
        setMessage('Player deleted successfully');
        fetchData();
      } catch (err) {
        setError('Failed to delete player');
      }
    }
  };

  const handleOpenMvpModal = (player) => {
    setSelectedPlayer(player);
    setMvpModalOpen(true);
  };

  const handleCloseMvpModal = () => {
    setMvpModalOpen(false);
    setSelectedPlayer(null);
  };

  const handleOpenPlayerModal = (player) => {
    setSelectedPlayerForModal(player);
    setPlayerModalOpen(true);
  };

  const handleClosePlayerModal = () => {
    setPlayerModalOpen(false);
    setSelectedPlayerForModal(null);
    // Refresh the player data when modal is closed
    fetchData();
  };

  const handlePlayerUpdate = () => {
    fetchData();
  };

  const handlePlayerDelete = () => {
    fetchData();
  };

  const handleAssignMVP = async (playerId, eventId) => {
    try {
      await api.post(`/api/players/${playerId}/mvp`, { eventId });
      setMessage('Champion crowned successfully! 👑');
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('MVP assignment error:', err);
      setError('Failed to crown champion: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewHistory = async (playerId) => {
    try {
      setHistoryLoading(prev => ({ ...prev, [playerId]: true }));
      setError('');
      
      const response = await api.get(`/api/players/${playerId}/mvp-history`);
      setPlayerHistories(prev => ({ ...prev, [playerId]: response.data.history || [] }));
      setExpandedHistory(prev => ({ ...prev, [playerId]: !prev[playerId] }));
    } catch (err) {
      console.error('History fetch error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to load battle history: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setHistoryLoading(prev => ({ ...prev, [playerId]: false }));
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setShowAddForm(false);
    setNewPlayer({ name: '' });
  };

  const handleSavePlayer = async (playerId, playerData) => {
    try {
      await api.put(`/api/players/${playerId}`, playerData);
      setMessage('Warrior updated successfully! ⚔️');
      setEditingPlayerId(null);
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update warrior');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCreatePlayer = async () => {
    try {
      const response = await api.post('/api/players', newPlayer);
      setMessage('New warrior recruited successfully! 🗡️');
      setShowAddForm(false);
      setNewPlayer({ name: '' });
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Create error:', err);
      setError(err.response?.data?.error || 'Failed to recruit warrior');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Removed search functionality - showing all players

  const mvpCount = players.filter(player => player.is_mvp).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading players...</p>
      </div>
    );
  }

  return (
    <div className="players">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">⚔️ Warriors Registry</h1>
          <p className="page-subtitle">Command your army of brave fighters and crown your champions</p>
        </div>

      {message && (
        <div className="alert alert-success">
          {message}
          <button 
            type="button" 
            className="alert-close"
            onClick={() => setMessage('')}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            type="button" 
            className="alert-close"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">{players.length}</div>
            <div className="stat-label">Total Warriors</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mvpCount}</div>
            <div className="stat-label">MVP's</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{events.length}</div>
            <div className="stat-label">Server Events</div>
          </div>
        </div>

      <div className="action-bar">
        <div className="action-bar-content">
          <h2>Warriors Registry</h2>
          <button
            onClick={handleAddPlayer}
            className="btn btn-primary"
          >
            🗡️ Recruit Warrior
          </button>
        </div>
      </div>

      {/* Available Players Panel */}
      <div className="available-players-panel">
        <div className="panel-header">
          <h3>👑 Available for MVP</h3>
          <span className="panel-subtitle">Warriors who can be crowned as champions</span>
        </div>
        <div className="available-players-list">
          {players.filter(player => !player.is_mvp).length === 0 ? (
            <div className="no-available-players">
              <div className="no-available-icon">👥</div>
              <p>No available warriors</p>
              <p className="no-available-subtitle">All warriors are already champions or no warriors exist</p>
            </div>
          ) : (
            <div className="available-players-grid">
              {players
                .filter(player => !player.is_mvp)
                .map(player => (
                  <div 
                    key={player.id} 
                    className="available-player-name"
                    onClick={() => handleOpenMvpModal(player)}
                    title="Click to crown as champion"
                  >
                    {player.name}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Add New Player Form */}
      {showAddForm && (
        <div className="player-form-card">
          <div className="form-header">
            <h3>🗡️ Recruit New Warrior</h3>
            <button onClick={handleCancelEdit} className="btn btn-ghost">
              Cancel
            </button>
          </div>
          <div className="form-body">
            <div className="form-group">
              <label>Warrior Name:</label>
              <input
                type="text"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                placeholder="Enter warrior name..."
              />
            </div>
            <div className="form-actions">
              <button 
                onClick={handleCreatePlayer} 
                className="btn btn-primary"
                disabled={!newPlayer.name}
              >
                ⚔️ Recruit Warrior
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      {players.length === 0 && !showAddForm ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚔️</div>
          <h3 className="empty-state-title">Your army awaits</h3>
          <p className="empty-state-text">
            Recruit your first brave warrior to build your legendary army
          </p>
          <button
            onClick={handleAddPlayer}
            className="btn btn-primary"
          >
            🗡️ Recruit First Warrior
          </button>
        </div>
      ) : players.length > 0 ? (
        <div className="players-list">
          {players.map(player => (
            <div key={player.id} className={`player-item ${player.is_mvp ? 'champion' : ''}`}>
              {editingPlayerId === player.id ? (
                <PlayerEditForm 
                  player={player}
                  onSave={handleSavePlayer}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div 
                  className="player-main clickable-player"
                  onClick={() => handleOpenPlayerModal(player)}
                  title="Click to manage player"
                >
                  <div className="player-info">
                    <h3>
                      <span>{player.name}</span>
                      {player.is_mvp ? <span className="champion-badge">👑</span> : null}
                    </h3>
                    <div className="player-details">
                      {player.mvp_event && (
                        <span className="player-battle">👑 {player.mvp_event}</span>
                      )}
                      {player.description && (
                        <span className="player-description">📝 {player.description}</span>
                      )}
                      {player.role && player.role !== 'normal' && (
                        <span className="player-role">
                          {player.role === 'leader' && '👑'}
                          {player.role === 'co-leader' && '🛡️'}
                          {player.role === 'elite' && '⭐'}
                          {player.role === 'normal' && '🏷️'}
                          {' '}
                          {player.role.charAt(0).toUpperCase() + player.role.slice(1).replace('-', ' ')}
                        </span>
                      )}
                      {player.is_on_holidays && (
                        <span className="player-holidays">🏖️</span>
                      )}
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      </div>

      {/* MVP Assignment Modal */}
      <MVPModal
        isOpen={mvpModalOpen}
        onClose={handleCloseMvpModal}
        events={events}
        player={selectedPlayer}
        onAssignMVP={handleAssignMVP}
        loading={false}
      />

      {/* Comprehensive Player Modal */}
      <PlayerModal
        isOpen={playerModalOpen}
        onClose={handleClosePlayerModal}
        player={selectedPlayerForModal}
        events={events}
        onPlayerUpdate={handlePlayerUpdate}
        onPlayerDelete={handlePlayerDelete}
        onAssignMVP={handleAssignMVP}
      />
    </div>
  );
};

export default Players;