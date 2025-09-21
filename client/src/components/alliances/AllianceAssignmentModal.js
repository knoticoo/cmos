import React, { useState, useEffect } from 'react';
import './AllianceAssignmentModal.css';

const AllianceAssignmentModal = ({ isOpen, onClose, events, alliance, onAssignAlliance, loading }) => {
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedEventId(null); // Reset selection when modal opens
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (alliance && selectedEventId) {
      await onAssignAlliance(alliance.id, selectedEventId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="alliance-modal-overlay" onClick={onClose}>
      <div className="alliance-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🚀 Deploy Alliance: {alliance?.name}</h3>
          <button onClick={onClose} className="btn btn-ghost">✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner"></div>
          ) : events.length === 0 ? (
            <div className="empty-state">No battles available for deployment.</div>
          ) : (
            <div className="event-selection-list">
              {events.map(event => (
                <div 
                  key={event.id} 
                  className={`event-selection-item ${selectedEventId === event.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <div className="event-details">
                    <span className="event-icon">⚔️</span>
                    <span className="event-name">{event.name}</span>
                  </div>
                  {event.description && (
                    <span className="event-description">
                      {event.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button 
            onClick={handleAssign} 
            className="btn btn-primary"
            disabled={!selectedEventId || loading}
          >
            {loading ? 'Deploying...' : '🚀 Deploy Alliance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllianceAssignmentModal;
