const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, getUserDatabase } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get all alliances for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Alliances GET request - User ID:', req.user.userId);
    const userDbName = await getUserDatabase(req.user.userId);
    console.log('User database name:', userDbName);
    
    // Ensure user database is initialized
    await database.initializeUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    console.log('Database connection established, querying alliances...');
    
    db.all(
      `SELECT a.*, COALESCE(a.is_blacklisted, 0) as is_blacklisted, e.name as event_name, ea.created_at as assigned_at
       FROM alliances a
       LEFT JOIN event_alliances ea ON a.id = ea.alliance_id
       LEFT JOIN events e ON ea.event_id = e.id
       ORDER BY a.created_at DESC`,
      (err, alliances) => {
        if (err) {
          console.error('Alliances fetch error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        
        console.log('Alliances fetched successfully:', alliances ? alliances.length : 0, 'alliances');
        
        // Convert INTEGER to boolean for frontend
        const processedAlliances = alliances.map(alliance => ({
          ...alliance,
          is_blacklisted: Boolean(alliance.is_blacklisted)
        }));
        
        res.json({ alliances: processedAlliances });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alliances' });
  }
});

// Create new alliance
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Alliance name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.run(
      'INSERT INTO alliances (name, description) VALUES (?, ?)',
      [name, description || ''],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating alliance' });
        }
        res.status(201).json({ 
          message: 'Alliance created successfully',
          alliance: { id: this.lastID, name }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Test routes to verify endpoints are working
router.get('/test', (req, res) => {
  console.log('GET test route hit');
  res.json({ message: 'GET method is working' });
});

router.patch('/test', (req, res) => {
  console.log('PATCH test route hit');
  res.json({ message: 'PATCH method is working' });
});

// Toggle blacklist status
router.patch('/:id/blacklist', authenticateToken, async (req, res) => {
  console.log('Blacklist route hit:', req.params.id, req.body);
  try {
    const { id } = req.params;
    const { isBlacklisted } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    console.log('Blacklist request:', { id, isBlacklisted, userId: req.user.userId });

    // First, ensure the column exists
    db.run('ALTER TABLE alliances ADD COLUMN is_blacklisted INTEGER DEFAULT 0', (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Column creation error:', err);
      }
    });

    // Use a simpler approach - check if alliance exists first
    db.get('SELECT id FROM alliances WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Alliance check error:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
      
      if (!row) {
        return res.status(404).json({ message: 'Alliance not found' });
      }

      // Now update the blacklist status
      db.run(
        'UPDATE alliances SET is_blacklisted = ? WHERE id = ?',
        [isBlacklisted ? 1 : 0, id],
        function(err) {
          if (err) {
            console.error('Blacklist update error:', err);
            return res.status(500).json({ message: 'Error updating blacklist status', error: err.message });
          }
          
          console.log('Blacklist update successful:', { changes: this.changes, id, isBlacklisted });
          
          res.json({ 
            message: isBlacklisted ? 'Alliance blacklisted successfully' : 'Alliance removed from blacklist successfully' 
          });
        }
      );
    });
  } catch (error) {
    console.error('Blacklist toggle error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update alliance
router.put('/:id', authenticateToken, [
  body('name').notEmpty().withMessage('Alliance name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.run(
      'UPDATE alliances SET name = ?, description = ? WHERE id = ?',
      [name, description || '', id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error updating alliance' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Alliance not found' });
        }
        res.json({ message: 'Alliance updated successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete alliance
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    // First delete event-alliance relationships
    db.run(
      'DELETE FROM event_alliances WHERE alliance_id = ?',
      [id],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting alliance relationships' });
        }

        // Then delete the alliance
        db.run(
          'DELETE FROM alliances WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error deleting alliance' });
            }
            if (this.changes === 0) {
              return res.status(404).json({ message: 'Alliance not found' });
            }
            res.json({ message: 'Alliance deleted successfully' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alliance with events
router.get('/:id/events', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.all(
      `SELECT e.*, p.name as mvp_player_name FROM events e
       INNER JOIN event_alliances ea ON e.id = ea.event_id
       LEFT JOIN players p ON e.mvp_player_id = p.id
       WHERE ea.alliance_id = ?
       ORDER BY e.created_at DESC`,
      [id],
      (err, events) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.json({ events });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alliance events' });
  }
});

module.exports = router;
