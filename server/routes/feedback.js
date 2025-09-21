const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Submit feedback (public endpoint)
router.post('/', [
  body('message').notEmpty().withMessage('Message is required'),
  body('feedbackType').isIn(['general', 'bug', 'feature', 'improvement']).withMessage('Invalid feedback type'),
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('subject').optional().isLength({ min: 5 }).withMessage('Subject must be at least 5 characters'),
  body('donationAmount').optional().isFloat({ min: 0 }).withMessage('Donation amount must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message, feedbackType, donationAmount } = req.body;
    const db = database.getDb(); // Main database

    db.run(
      `INSERT INTO feedback (name, email, subject, message, feedback_type, donation_amount, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name || null, email || null, subject || null, message, feedbackType, donationAmount || null],
      function(err) {
        if (err) {
          console.error('Error creating feedback:', err);
          return res.status(500).json({ message: 'Error submitting feedback' });
        }
        
        res.status(201).json({ 
          message: 'Feedback submitted successfully',
          feedbackId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all feedback (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = database.getDb(); // Main database
    
    db.all(
      `SELECT id, name, email, subject, message, feedback_type, donation_amount, 
              created_at, status, admin_notes
       FROM feedback 
       ORDER BY created_at DESC`,
      (err, feedback) => {
        if (err) {
          console.error('Error fetching feedback:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        res.json({ feedback });
      }
    );
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// Update feedback status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['new', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('adminNotes').optional().isLength({ min: 5 }).withMessage('Admin notes must be at least 5 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const db = database.getDb(); // Main database

    db.run(
      'UPDATE feedback SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, adminNotes || null, id],
      function(err) {
        if (err) {
          console.error('Error updating feedback:', err);
          return res.status(500).json({ message: 'Error updating feedback' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ message: 'Feedback status updated successfully' });
      }
    );
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete feedback (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = database.getDb(); // Main database

    db.run(
      'DELETE FROM feedback WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          console.error('Error deleting feedback:', err);
          return res.status(500).json({ message: 'Error deleting feedback' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ message: 'Feedback deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = database.getDb(); // Main database
    
    db.all(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN donation_amount > 0 THEN donation_amount ELSE 0 END) as total_donations,
        SUM(CASE WHEN feedback_type = 'bug' THEN 1 ELSE 0 END) as bug_count,
        SUM(CASE WHEN feedback_type = 'feature' THEN 1 ELSE 0 END) as feature_count,
        SUM(CASE WHEN feedback_type = 'improvement' THEN 1 ELSE 0 END) as improvement_count,
        SUM(CASE WHEN feedback_type = 'general' THEN 1 ELSE 0 END) as general_count
       FROM feedback`,
      (err, stats) => {
        if (err) {
          console.error('Error fetching feedback stats:', err);
          return res.status(500).json({ message: 'Database error' });
        }
        res.json({ stats: stats[0] });
      }
    );
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ message: 'Error fetching feedback statistics' });
  }
});

module.exports = router;
