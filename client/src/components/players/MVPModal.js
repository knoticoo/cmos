import React from 'react';
import './MVPModal.css';

const MVPModal = ({ isOpen, onClose, events, player, onAssignMVP, loading }) => {
  if (!isOpen) return null;

  const handleEventSelect = (eventId) => {
    onAssignMVP(player.id, eventId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>👑 Crown Champion</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            Select a battle to crown <strong>{player?.name}</strong> as the champion:
          </p>
          
          {events.length === 0 ? (
            <div className="no-events">
              <div className="no-events-icon">⚔️</div>
              <p>No battles available</p>
              <p className="no-events-subtitle">Create a battle first to crown champions</p>
            </div>
          ) : (
            <div className="events-list">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event.id)}
                  className="event-option"
                  disabled={loading}
                >
                  <div className="event-option-content">
                    <span className="event-icon">⚔️</span>
                    <div className="event-details">
                      <span className="event-name">{event.name}</span>
                      <span className="event-date">
                        Created: {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {event.mvp_player_name && (
                      <span className="current-champion">
                        Current: {event.mvp_player_name}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MVPModal;
