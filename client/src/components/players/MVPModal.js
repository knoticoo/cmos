import React, { useState } from 'react';
import './MVPModal.css';

const MVPModal = ({ isOpen, onClose, events, player, onAssignMVP, loading }) => {
  const [selectedEventId, setSelectedEventId] = useState(null);

  if (!isOpen) return null;

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
  };

  const handleCrownChampion = () => {
    if (selectedEventId) {
      onAssignMVP(player.id, selectedEventId);
      setSelectedEventId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedEventId(null);
    onClose();
  };

  return (
    <div className="mvp-modal-overlay" onClick={handleClose}>
      <div className="mvp-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Hero Header */}
        <div className="mvp-hero-header">
          <div className="mvp-hero-background">
            <div className="crown-pattern"></div>
          </div>
          <div className="mvp-hero-content">
            <div className="crown-animation">
              <div className="crown-main">👑</div>
              <div className="crown-sparkles">
                <span className="sparkle sparkle-1">✨</span>
                <span className="sparkle sparkle-2">⭐</span>
                <span className="sparkle sparkle-3">✨</span>
                <span className="sparkle sparkle-4">⭐</span>
              </div>
            </div>
            <div className="mvp-hero-info">
              <h2>Assign MVP</h2>
              <p>Select a battle to assign <strong>{player?.name}</strong> as MVP</p>
            </div>
          </div>
          <button className="mvp-close-btn" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mvp-modal-content">
          {events.length === 0 ? (
            <div className="no-battles-state">
              <div className="no-battles-icon">⚔️</div>
              <h3>No Battles Available</h3>
              <p>Create battles first to assign MVP</p>
              <div className="create-battle-hint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Go to Events page to create your first battle
              </div>
            </div>
          ) : (
            <div className="battles-selection">
              <div className="selection-header">
                <h3>Choose Your Battle</h3>
                <p>Select the battle where {player?.name} will be assigned as MVP</p>
              </div>

              <div className="battles-grid">
                {events.map(event => (
                  <div
                    key={event.id}
                    className={`battle-card ${selectedEventId === event.id ? 'selected' : ''} ${event.mvp_player_name ? 'has-champion' : ''}`}
                    onClick={() => handleEventSelect(event.id)}
                  >
                    <div className="battle-header">
                      <div className="battle-icon">⚔️</div>
                      <div className="battle-info">
                        <h4>{event.name}</h4>
                        <div className="battle-date">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {new Date(event.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {event.mvp_player_name && (
                      <div className="current-champion-info">
                        <div className="champion-badge">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 3h12l4 6-10 13L2 9l4-6z"></path>
                          </svg>
                          Current MVP
                        </div>
                        <div className="champion-name">{event.mvp_player_name}</div>
                      </div>
                    )}

                    {selectedEventId === event.id && (
                      <div className="selection-indicator">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    )}

                    <div className="battle-overlay"></div>
                  </div>
                ))}
              </div>

              {selectedEventId && (
                <div className="crown-action">
                  <button
                    onClick={handleCrownChampion}
                    disabled={loading}
                    className="crown-champion-btn"
                  >
                    {loading ? (
                      <>
                        <div className="crown-spinner"></div>
                        <span>Assigning MVP...</span>
                      </>
                    ) : (
                      <>
                        <div className="btn-crown">👑</div>
                        <span>Assign as MVP</span>
                        <div className="btn-sparkle">✨</div>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MVPModal;
