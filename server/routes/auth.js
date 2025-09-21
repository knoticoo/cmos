const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Register new user (admin only)
router.post('/register', authenticateToken, requireAdmin, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const db = database.getDb();

    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const databaseName = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      db.run(
        'INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)',
        [username, hashedPassword],
        function(err) {
          if (err) {
            // Check if it's a unique constraint violation
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              return res.status(400).json({ message: 'Username already exists' });
            }
            return res.status(500).json({ message: 'Error creating user' });
          }

          const userId = this.lastID;

          // Create user database entry
          db.run(
            'INSERT INTO user_databases (user_id, database_name) VALUES (?, ?)',
            [userId, databaseName],
            async (err) => {
              if (err) {
                // If user database creation fails, clean up the user
                db.run('DELETE FROM users WHERE id = ?', [userId]);
                return res.status(500).json({ message: 'Error creating user database' });
              }

              // Initialize the user database
              try {
                await database.initializeUserDatabase(userId);
                res.status(201).json({ 
                  message: 'User created successfully',
                  userId: userId,
                  databaseName: databaseName
                });
              } catch (dbErr) {
                // If user database initialization fails, clean up both entries
                db.run('DELETE FROM user_databases WHERE user_id = ?', [userId]);
                db.run('DELETE FROM users WHERE id = ?', [userId]);
                res.status(500).json({ message: 'Error initializing user database' });
              }
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const db = database.getDb();

    db.get(
      'SELECT id, username, password, is_admin FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { 
            userId: user.id, 
            username: user.username, 
            isAdmin: user.is_admin 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      isAdmin: req.user.isAdmin
    }
  });
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const db = database.getDb();
  db.all(
    `SELECT u.id, u.username, u.is_admin, u.created_at, ud.database_name 
     FROM users u 
     LEFT JOIN user_databases ud ON u.id = ud.user_id 
     ORDER BY u.created_at DESC`,
    (err, users) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ users });
    }
  );
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { username, password, isAdmin } = req.body;
    const db = database.getDb();

    // Check if username already exists (excluding current user)
    db.get(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, id],
      (err, existingUser) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        if (existingUser) {
          return res.status(400).json({ message: 'Username already exists' });
        }

        // Update user
        if (password) {
          // Update with password
          bcrypt.hash(password, 10).then(hashedPassword => {
            db.run(
              'UPDATE users SET username = ?, password = ?, is_admin = ? WHERE id = ?',
              [username, hashedPassword, isAdmin ? 1 : 0, id],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: 'Error updating user' });
                }
                if (this.changes === 0) {
                  return res.status(404).json({ message: 'User not found' });
                }
                res.json({ message: 'User updated successfully' });
              }
            );
          });
        } else {
          // Update without password
          db.run(
            'UPDATE users SET username = ?, is_admin = ? WHERE id = ?',
            [username, isAdmin ? 1 : 0, id],
            function(err) {
              if (err) {
                return res.status(500).json({ message: 'Error updating user' });
              }
              if (this.changes === 0) {
                return res.status(404).json({ message: 'User not found' });
              }
              res.json({ message: 'User updated successfully' });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = database.getDb();

    // Check if user exists and is not admin
    db.get(
      'SELECT id, is_admin FROM users WHERE id = ?',
      [id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if (user.is_admin) {
          return res.status(400).json({ message: 'Cannot delete admin user' });
        }

        // Delete user database entry first
        db.run(
          'DELETE FROM user_databases WHERE user_id = ?',
          [id],
          (err) => {
            if (err) {
              return res.status(500).json({ message: 'Error deleting user database' });
            }

            // Delete user
            db.run(
              'DELETE FROM users WHERE id = ?',
              [id],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: 'Error deleting user' });
                }
                res.json({ message: 'User deleted successfully' });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
