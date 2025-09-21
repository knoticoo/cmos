import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    players: 0,
    events: 0,
    alliances: 0,
    mvps: 0
  });
  const [currentMvps, setCurrentMvps] = useState([]);
  const [currentAllianceWinners, setCurrentAllianceWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showMvpModal, setShowMvpModal] = useState(false);
  const [allMvps, setAllMvps] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMvpPanelClick = () => {
    setShowMvpModal(true);
  };

  const handleCloseMvpModal = () => {
    setShowMvpModal(false);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to use the dedicated dashboard endpoint first
      try {
        const dashboardRes = await api.get('/api/dashboard');
        const dashboardData = dashboardRes.data;
        
        setStats({
          players: dashboardData.stats.totalPlayers || 0,
          events: dashboardData.stats.totalEvents || 0,
          alliances: dashboardData.stats.totalAlliances || 0,
          mvps: dashboardData.recentActivity.players.filter(player => player.is_mvp).length
        });

        // Set recent MVPs
        const mvps = dashboardData.recentActivity.players
          .filter(player => player.is_mvp)
          .slice(0, 5)
          .map(player => ({
            playerName: player.name,
            eventName: player.mvp_event || 'Unknown Event',
            assignedDate: new Date(player.mvp_assigned_date || player.created_at).toLocaleDateString()
          }));
        setCurrentMvps(mvps);

        // Set all MVPs for modal
        const allMvpsData = dashboardData.recentActivity.players
          .filter(player => player.is_mvp)
          .map(player => ({
            playerName: player.name,
            eventName: player.mvp_event || 'Unknown Event',
            assignedDate: new Date(player.mvp_assigned_date || player.created_at).toLocaleDateString()
          }));
        setAllMvps(allMvpsData);

        // Set recent Alliance Winners
        const winners = dashboardData.recentActivity.alliances
          .filter(alliance => alliance.event_name)
          .slice(0, 5)
          .map(alliance => ({
            allianceName: alliance.name,
            eventName: alliance.event_name,
            assignedDate: new Date(alliance.assigned_at || alliance.created_at).toLocaleDateString()
          }));
        setCurrentAllianceWinners(winners);
        
      } catch (dashboardErr) {
        console.warn('Dashboard endpoint failed, falling back to individual endpoints:', dashboardErr);
        
        // Fallback to individual API calls
        const [playersRes, eventsRes, alliancesRes] = await Promise.all([
          api.get('/api/players'),
          api.get('/api/events'),
          api.get('/api/alliances')
        ]);

        const players = playersRes.data.players || [];
        const events = eventsRes.data.events || [];
        const alliances = alliancesRes.data.alliances || [];

        // Count MVPs (players with is_mvp = 1)
        const mvpCount = players.filter(player => player.is_mvp).length;

        setStats({
          players: players.length,
          events: events.length,
          alliances: alliances.length,
          mvps: mvpCount
        });

        // Get top 5 MVPs from players data
        const mvps = players
          .filter(player => player.is_mvp && player.mvp_event)
          .slice(0, 5)
          .map(player => ({
            playerName: player.name,
            eventName: player.mvp_event,
            assignedDate: new Date(player.updated_at || player.created_at).toLocaleDateString()
          }));
        setCurrentMvps(mvps);

        // Set all MVPs for modal
        const allMvpsData = players
          .filter(player => player.is_mvp && player.mvp_event)
          .map(player => ({
            playerName: player.name,
            eventName: player.mvp_event,
            assignedDate: new Date(player.updated_at || player.created_at).toLocaleDateString()
          }));
        setAllMvps(allMvpsData);

        // Get top 5 Alliance Winners from alliances data
        const winners = alliances
          .filter(alliance => alliance.event_name)
          .slice(0, 5)
          .map(alliance => ({
            allianceName: alliance.name,
            eventName: alliance.event_name,
            assignedDate: new Date(alliance.assigned_at || alliance.created_at).toLocaleDateString()
          }));
        setCurrentAllianceWinners(winners);
      }

    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container animate-fade-in">
        <div className="loading-spinner"></div>
        <p>Loading your kingdom dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Kingdom Dashboard</h1>
          <p className="dashboard-subtitle">
            Command your realm with strategic insights and real-time battle statistics
          </p>
        </div>

        {message && (
          <div className="alert alert-success animate-slide-down">
            <span>✅ {message}</span>
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

        <div className="stats-grid">
          <div className="stat-card primary interactive-card" onClick={() => window.location.href = '/players'}>
            <div className="stat-header">
              <h3 className="stat-title">Kingdom Warriors</h3>
              <div className="stat-icon primary">👥</div>
            </div>
            <div className="stat-value">{stats.players}</div>
            <p className="stat-description">Brave warriors ready for battle</p>
          </div>
          
          <div className="stat-card success interactive-card" onClick={() => window.location.href = '/events'}>
            <div className="stat-header">
              <h3 className="stat-title">Server Events</h3>
              <div className="stat-icon success">⚔️</div>
            </div>
            <div className="stat-value">{stats.events}</div>
            <p className="stat-description">Legendary battles fought and won</p>
          </div>
          
          <div className="stat-card warning interactive-card" onClick={() => window.location.href = '/alliances'}>
            <div className="stat-header">
              <h3 className="stat-title">Server Alliances</h3>
              <div className="stat-icon warning">🏰</div>
            </div>
            <div className="stat-value">{stats.alliances}</div>
            <p className="stat-description">Powerful alliances forged in unity</p>
          </div>
          
          <div className="stat-card info interactive-card" onClick={handleMvpPanelClick}>
            <div className="stat-header">
              <h3 className="stat-title">MVP Champions</h3>
              <div className="stat-icon info">👑</div>
            </div>
            <div className="stat-value">{stats.mvps}</div>
            <p className="stat-description">Heroes crowned with glory</p>
          </div>
        </div>

        <div className="content-grid">
          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">👑 Hall of Champions</h2>
              <p className="section-subtitle">Warriors who earned the crown of honor</p>
            </div>
            <div className="section-content">
              {currentMvps.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👑</div>
                  <h3 className="empty-state-title">No Champions Yet</h3>
                  <p className="empty-state-text">Crown your first MVP champion by assigning them to epic battles</p>
                </div>
              ) : (
                <ul className="item-list">
                  {currentMvps.map((mvp, index) => (
                    <li key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="item-info">
                        <div className="item-name">🏆 {mvp.playerName}</div>
                        <div className="item-meta">⚔️ {mvp.eventName} • {mvp.assignedDate}</div>
                      </div>
                      <span className="item-status active mvp-badge">MVP</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="content-section">
            <div className="section-header">
              <h2 className="section-title">🏆 Victorious Alliances</h2>
              <p className="section-subtitle">United kingdoms that conquered the battlefield</p>
            </div>
            <div className="section-content">
              {currentAllianceWinners.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🏰</div>
                  <h3 className="empty-state-title">No Victorious Alliances</h3>
                  <p className="empty-state-text">Form powerful alliances and lead them to victory in epic battles</p>
                </div>
              ) : (
                <ul className="item-list">
                  {currentAllianceWinners.map((winner, index) => (
                    <li key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="item-info">
                        <div className="item-name">🏰 {winner.allianceName}</div>
                        <div className="item-meta">⚔️ {winner.eventName} • {winner.assignedDate}</div>
                      </div>
                      <span className="item-status active winner-badge">Victorious</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* MVP Modal */}
        {showMvpModal && (
          <div className="modal-overlay" onClick={handleCloseMvpModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">👑 All MVP Champions</h2>
                <button 
                  className="modal-close" 
                  onClick={handleCloseMvpModal}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                {allMvps.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">👑</div>
                    <h3 className="empty-state-title">No Champions Yet</h3>
                    <p className="empty-state-text">Crown your first MVP champion by assigning them to epic battles</p>
                  </div>
                ) : (
                  <div className="mvp-list">
                    {allMvps.map((mvp, index) => (
                      <div key={index} className="mvp-item">
                        <div className="mvp-info">
                          <div className="mvp-name">🏆 {mvp.playerName}</div>
                          <div className="mvp-details">⚔️ {mvp.eventName} • {mvp.assignedDate}</div>
                        </div>
                        <span className="mvp-badge">MVP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;