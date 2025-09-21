const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, getUserDatabase } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Get all events for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);
    
    db.all(
      `SELECT e.*, p.name as mvp_player_name 
       FROM events e 
       LEFT JOIN players p ON e.mvp_player_id = p.id 
       ORDER BY e.created_at DESC`,
      (err, events) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.json({ events });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Create new event
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Event name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, mvpPlayerId } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.run(
      'INSERT INTO events (name, mvp_player_id) VALUES (?, ?)',
      [name, mvpPlayerId || null],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating event' });
        }
        res.status(201).json({ 
          message: 'Event created successfully',
          event: { id: this.lastID, name, mvp_player_id: mvpPlayerId }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', authenticateToken, [
  body('name').notEmpty().withMessage('Event name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, mvpPlayerId } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.run(
      'UPDATE events SET name = ?, mvp_player_id = ? WHERE id = ?',
      [name, mvpPlayerId || null, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error updating event' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ message: 'Event updated successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    // First delete event-alliance relationships
    db.run(
      'DELETE FROM event_alliances WHERE event_id = ?',
      [id],
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error deleting event alliances' });
        }

        // Then delete the event
        db.run(
          'DELETE FROM events WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Error deleting event' });
            }
            if (this.changes === 0) {
              return res.status(404).json({ message: 'Event not found' });
            }
            res.json({ message: 'Event deleted successfully' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign alliance to event
router.post('/:id/alliances', authenticateToken, async (req, res) => {
  try {
    console.log('Alliance assignment request:', { 
      eventId: req.params.id, 
      allianceId: req.body.allianceId, 
      allianceIdType: typeof req.body.allianceId,
      userId: req.user.userId,
      body: req.body
    });
    
    // Manual validation
    if (!req.body.allianceId) {
      console.log('Missing allianceId in request body');
      return res.status(400).json({ message: 'Alliance ID is required' });
    }

    const { id } = req.params;
    const { allianceId } = req.body;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    // Check if relationship already exists
    db.get(
      'SELECT id FROM event_alliances WHERE event_id = ? AND alliance_id = ?',
      [id, allianceId],
      (err, row) => {
        if (err) {
          console.error('Alliance check error:', err);
          return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (row) {
          console.log('Alliance already assigned to event');
          return res.status(400).json({ message: 'Alliance already assigned to this event' });
        }

        // Create the relationship
        db.run(
          'INSERT INTO event_alliances (event_id, alliance_id) VALUES (?, ?)',
          [id, allianceId],
          function(err) {
            if (err) {
              console.error('Alliance assignment error:', err);
              return res.status(500).json({ message: 'Error assigning alliance to event', error: err.message });
            }
            console.log('Alliance assigned successfully:', { eventId: id, allianceId, changes: this.changes });
            res.status(201).json({ message: 'Alliance assigned to event successfully' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Alliance assignment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove alliance from event
router.delete('/:id/alliances/:allianceId', authenticateToken, async (req, res) => {
  try {
    const { id, allianceId } = req.params;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.run(
      'DELETE FROM event_alliances WHERE event_id = ? AND alliance_id = ?',
      [id, allianceId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error removing alliance from event' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Alliance not found in this event' });
        }
        res.json({ message: 'Alliance removed from event successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event with alliances
router.get('/:id/alliances', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userDbName = await getUserDatabase(req.user.userId);
    const db = database.getDb(req.user.userId);

    db.all(
      `SELECT a.* FROM alliances a
       INNER JOIN event_alliances ea ON a.id = ea.alliance_id
       WHERE ea.event_id = ?`,
      [id],
      (err, alliances) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        res.json({ alliances });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event alliances' });
  }
});

module.exports = router;
