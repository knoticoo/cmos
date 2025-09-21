const express = require('express');
const { authenticateToken, getUserDatabase } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// GET /api/dashboard - Get dashboard statistics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    // Ensure user database is initialized
    await database.initializeUserDatabase(req.user.userId);
    
    // Get all statistics in parallel
    const [
      playersResult,
      eventsResult,
      alliancesResult,
      recentPlayersResult,
      recentEventsResult,
      recentAlliancesResult
    ] = await Promise.all([
      // Total players
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM players', (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        });
      }),
      
      // Total events
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM events', (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        });
      }),
      
      // Total alliances
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM alliances', (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        });
      }),
      
      // Recent MVP players (last 5 MVPs)
      new Promise((resolve, reject) => {
        db.all(`
          SELECT DISTINCT p.*, 
                 1 as is_mvp,
                 e.name as mvp_event,
                 e.created_at as mvp_assigned_date
          FROM players p 
          INNER JOIN events e ON p.id = e.mvp_player_id 
          ORDER BY e.created_at DESC 
          LIMIT 5
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      }),
      
      // Recent events (last 5)
      new Promise((resolve, reject) => {
        db.all(`
          SELECT e.*, p.name as mvp_player_name 
          FROM events e 
          LEFT JOIN players p ON e.mvp_player_id = p.id 
          ORDER BY e.created_at DESC 
          LIMIT 5
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      }),
      
      // Recent alliances (last 5) with event info
      new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            a.id, 
            a.name, 
            a.created_at, 
            COALESCE(a.is_blacklisted, 0) as is_blacklisted,
            e.name as event_name,
            ea.created_at as assigned_at
          FROM alliances a
          LEFT JOIN event_alliances ea ON a.id = ea.alliance_id
          LEFT JOIN events e ON ea.event_id = e.id
          ORDER BY a.created_at DESC 
          LIMIT 5
        `, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      })
    ]);

    // Format the response
    const dashboardData = {
      stats: {
        totalPlayers: playersResult,
        totalEvents: eventsResult,
        totalAlliances: alliancesResult
      },
      recentActivity: {
        players: recentPlayersResult.map(player => ({
          id: player.id,
          name: player.name,
          created_at: player.created_at,
          is_mvp: Boolean(player.is_mvp),
          mvp_count: player.mvp_count || 0,
          mvp_event: player.mvp_event,
          mvp_assigned_date: player.mvp_assigned_date
        })),
        events: recentEventsResult.map(event => ({
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          status: event.status
        })),
        alliances: recentAlliancesResult.map(alliance => ({
          id: alliance.id,
          name: alliance.name,
          created_at: alliance.created_at,
          is_blacklisted: Boolean(alliance.is_blacklisted),
          event_name: alliance.event_name,
          assigned_at: alliance.assigned_at
        }))
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      message: 'Failed to load dashboard data',
      error: error.message 
    });
  }
});

module.exports = router;
