const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const database = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const eventRoutes = require('./routes/events');
const allianceRoutes = require('./routes/alliances');
const feedbackRoutes = require('./routes/feedback');
const dashboardRoutes = require('./routes/dashboard');
const patchNotesRoutes = require('./routes/patch-notes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
database.connect().then(() => {
  console.log('Database initialized successfully');
  
  // Register routes after database is ready
  app.use('/api/auth', authRoutes);
  app.use('/api/players', playerRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/alliances', allianceRoutes);
  app.use('/api/feedback', feedbackRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/patch-notes', patchNotesRoutes);
  
  // Create default admin user if it doesn't exist
  const bcrypt = require('bcryptjs');
  const db = database.getDb();
  
  db.get('SELECT id FROM users WHERE is_admin = 1', (err, row) => {
    if (err) {
      console.error('Error checking for admin user:', err);
    } else if (!row) {
      // Create default admin user
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      bcrypt.hash(adminPassword, 10).then(hashedPassword => {
        db.run(
          'INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)',
          ['admin', hashedPassword],
          (err) => {
            if (err) {
              console.error('Error creating admin user:', err);
            } else {
              console.log('Default admin user created: username=admin, password=' + adminPassword);
            }
          }
        );
      });
    }
  });
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
  });

  // Serve static files from React app in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  // Start server only after everything is initialized
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  database.close();
  process.exit(0);
});

module.exports = app;
