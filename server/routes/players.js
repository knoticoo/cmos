const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, getUserDatabase } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get all players for current user with MVP status
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    db.all(
      `SELECT p.*, 
              CASE WHEN e.mvp_player_id IS NOT NULL THEN 1 ELSE 0 END as is_mvp,
              e.name as mvp_event
       FROM players p 
       LEFT JOIN events e ON p.id = e.mvp_player_id 
       ORDER BY p.created_at DESC`,
      (err, players) => {
        if (err) {
          console.error('Error fetching players:', err);
          return res.status(500).json({ message: 'Database error: ' + err.message });
        }
        
        // Group players and consolidate MVP information
        const playerMap = new Map();
        players.forEach(player => {
          if (!playerMap.has(player.id)) {
            playerMap.set(player.id, {
              id: player.id,
              name: player.name,
              description: player.description || '',
              role: player.role || 'normal',
              is_on_holidays: Boolean(player.is_on_holidays),
              mvp_count: player.mvp_count,
              last_mvp_date: player.last_mvp_date,
              created_at: player.created_at,
              is_mvp: Boolean(player.is_mvp),
              mvp_event: player.mvp_event
            });
          }
        });
        
        const consolidatedPlayers = Array.from(playerMap.values());
        res.json({ players: consolidatedPlayers });
      }
    );
  } catch (error) {
    console.error('Error in players endpoint:', error);
    res.status(500).json({ message: 'Error fetching players: ' + error.message });
  }
});

// Create new player
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Player name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    
    // First, let's check the current max ID in the table and fix auto-increment if needed
    db.get('SELECT MAX(id) as maxId FROM players', (err, row) => {
      if (err) {
        console.error('Error getting max ID:', err);
        return res.status(500).json({ message: 'Error checking database' });
      }
      
      // If max ID is null (empty table), set the sequence to start from 1
      if (row.maxId === null) {
        db.run('DELETE FROM sqlite_sequence WHERE name = "players"', (err) => {
          if (err) console.log('Error resetting sequence:', err);
        });
      } else {
        // Ensure the sequence is set to the correct value
        db.run('INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ("players", ?)', [row.maxId], (err) => {
          if (err) console.log('Error setting sequence:', err);
        });
      }
      
      // Use a more reliable method to get the ID
      db.run(
        'INSERT INTO players (name) VALUES (?)',
        [name],
        function(err) {
          if (err) {
            console.error('Error creating player:', err);
            return res.status(500).json({ message: 'Error creating player' });
          }
          
          // Always get the actual ID from the database to ensure accuracy
          db.get('SELECT id, name, created_at FROM players WHERE rowid = ?', [this.lastID], (err, player) => {
            if (err) {
              console.error('Error getting player by rowid:', err);
              // Fallback to getting by name and timestamp
              db.get('SELECT id, name, created_at FROM players WHERE name = ? ORDER BY created_at DESC LIMIT 1', [name], (err, player) => {
                if (err) {
                  console.error('Error getting player by name:', err);
                  return res.status(500).json({ message: 'Error getting player ID' });
                }
                console.log('Retrieved player ID by name:', player.id);
                res.status(201).json({ 
                  message: 'Player created successfully',
                  player: { id: player.id, name: player.name }
                });
              });
            } else {
              console.log('Retrieved player ID by rowid:', player.id);
              res.status(201).json({ 
                message: 'Player created successfully',
                player: { id: player.id, name: player.name }
              });
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get player MVP history (must be before /:id routes)
router.get('/:id/mvp-history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching history for player ID:', id);
    
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    if (!db) {
      console.error('Database not found for user:', req.user.userId);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // First, let's check if the events table exists and has the right structure
    db.all("PRAGMA table_info(events)", [], (pragmaErr, tableInfo) => {
      if (pragmaErr) {
        console.error('Error checking table structure:', pragmaErr);
        return res.status(500).json({ message: 'Error checking table structure: ' + pragmaErr.message });
      }
      
      console.log('Events table structure:', tableInfo);
      
      // Check if mvp_player_id column exists
      const hasMvpPlayerIdColumn = tableInfo.some(col => col.name === 'mvp_player_id');
      if (!hasMvpPlayerIdColumn) {
        console.error('mvp_player_id column not found in events table');
        return res.status(500).json({ message: 'Database schema error: mvp_player_id column not found' });
      }

      // Now execute the main query
      const query = `SELECT e.name as event_name, e.created_at as assigned_date 
                     FROM events e 
                     WHERE e.mvp_player_id = ? 
                     ORDER BY e.created_at DESC`;
      
      console.log('Executing query:', query, 'with player ID:', id);

      db.all(query, [id], (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ message: 'Error fetching player history: ' + err.message });
        }
        
        console.log('Query result:', rows);
        res.json({ history: rows || [] });
      });
    });
  } catch (error) {
    console.error('Server error in mvp-history:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update player
router.put('/:id', authenticateToken, [
  body('name').notEmpty().withMessage('Player name is required'),
  body('role').optional().isIn(['leader', 'co-leader', 'elite', 'normal']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, role, is_on_holidays } = req.body;
    
    
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    const updateQuery = 'UPDATE players SET name = ?, description = ?, role = ?, is_on_holidays = ? WHERE id = ?';
    const updateParams = [name, description || '', role || 'normal', is_on_holidays ? 1 : 0, id];
    
    db.run(updateQuery, updateParams, function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating player' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Player not found' });
      }
      res.json({ message: 'Player updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete player
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.run(
      'DELETE FROM players WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error deleting player' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Player not found' });
        }
        res.json({ message: 'Player deleted successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign MVP to player
router.post('/:id/mvp', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { eventId } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    // Update player's MVP count and last MVP date
    db.run(
      'UPDATE players SET mvp_count = mvp_count + 1, last_mvp_date = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error updating player MVP status' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Player not found' });
        }

        // If eventId is provided, update the event's MVP
        if (eventId) {
          db.run(
            'UPDATE events SET mvp_player_id = ? WHERE id = ?',
            [id, eventId],
            (err) => {
              if (err) {
                return res.status(500).json({ message: 'Error updating event MVP' });
              }
              res.json({ message: 'MVP assigned successfully' });
            }
          );
        } else {
          res.json({ message: 'MVP assigned successfully' });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get MVP rotation status
router.get('/mvp/rotation', authenticateToken, async (req, res) => {
  try {
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    db.all(
      'SELECT id, name, mvp_count, last_mvp_date FROM players ORDER BY mvp_count ASC, last_mvp_date ASC',
      (err, players) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        const totalPlayers = players.length;
        const playersWithMVP = players.filter(p => p.mvp_count > 0).length;
        const needsReset = playersWithMVP === totalPlayers && totalPlayers > 0;
        
        res.json({
          players,
          totalPlayers,
          playersWithMVP,
          needsReset,
          nextMVP: players[0] // Player with lowest MVP count
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching MVP rotation status' });
  }
});


// Reset MVP rotation
router.post('/mvp/reset', authenticateToken, async (req, res) => {
  try {
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    db.run(
      'UPDATE players SET mvp_count = 0, last_mvp_date = NULL',
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error resetting MVP rotation' });
        }
        res.json({ message: 'MVP rotation reset successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
