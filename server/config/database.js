const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.mainDb = null;
    this.userDbs = new Map(); // Cache for user databases
  }

  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../data/main.db');
      this.mainDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error opening main database:', err.message);
          reject(err);
        } else {
          console.log('Connected to main SQLite database');
          this.initializeMainTables().then(resolve).catch(reject);
        }
      });
    });
  }

  initializeMainTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          is_admin BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // User databases table (to track which database each user should use)
        `CREATE TABLE IF NOT EXISTS user_databases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          database_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        // Feedback table
        `CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          subject TEXT,
          message TEXT NOT NULL,
          feedback_type TEXT NOT NULL DEFAULT 'general',
          donation_amount DECIMAL(10,2),
          status TEXT DEFAULT 'new',
          admin_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME
        )`
      ];

      let completed = 0;
      tables.forEach((table, index) => {
        this.mainDb.run(table, (err) => {
          if (err) {
            console.error(`Error creating main table ${index + 1}:`, err.message);
            reject(err);
          } else {
            completed++;
            if (completed === tables.length) {
              resolve();
            }
          }
        });
      });
    });
  }

  // Initialize user-specific database with all necessary tables
  initializeUserDatabase(userId) {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '../data', `user_${userId}.db`);
      const userDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error(`Error creating user database for user ${userId}:`, err.message);
          reject(err);
        } else {
          console.log(`Created user database for user ${userId}`);
          this.userDbs.set(userId, userDb);
          
          const tables = [
            // Players table
            `CREATE TABLE IF NOT EXISTS players (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              description TEXT,
              role TEXT DEFAULT 'normal',
              is_on_holidays INTEGER DEFAULT 0,
              mvp_count INTEGER DEFAULT 0,
              last_mvp_date DATETIME,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Events table
            `CREATE TABLE IF NOT EXISTS events (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              mvp_player_id INTEGER,
              mvp_player_name TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (mvp_player_id) REFERENCES players (id)
            )`,
            
            // Alliances table
            `CREATE TABLE IF NOT EXISTS alliances (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              description TEXT,
              is_blacklisted INTEGER DEFAULT 0,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Event-Alliance relationships
            `CREATE TABLE IF NOT EXISTS event_alliances (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              event_id INTEGER NOT NULL,
              alliance_id INTEGER NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (event_id) REFERENCES events (id),
              FOREIGN KEY (alliance_id) REFERENCES alliances (id)
            )`
          ];

          let completed = 0;
          tables.forEach((table, index) => {
            userDb.run(table, (err) => {
              if (err) {
                console.error(`Error creating user table ${index + 1}:`, err.message);
                reject(err);
              } else {
                completed++;
                if (completed === tables.length) {
                  // Add migration for new columns
                  userDb.run('ALTER TABLE alliances ADD COLUMN description TEXT', (err) => {
                    // Ignore error if column already exists
                  });
                  userDb.run('ALTER TABLE alliances ADD COLUMN is_blacklisted INTEGER DEFAULT 0', (err) => {
                    // Ignore error if column already exists
                  });
                  userDb.run('ALTER TABLE players ADD COLUMN description TEXT', (err) => {
                    // Ignore error if column already exists
                  });
                  userDb.run('ALTER TABLE players ADD COLUMN role TEXT DEFAULT "normal"', (err) => {
                    // Ignore error if column already exists
                  });
                  userDb.run('ALTER TABLE players ADD COLUMN is_on_holidays INTEGER DEFAULT 0', (err) => {
                    // Ignore error if column already exists
                    resolve();
                  });
                }
              }
            });
          });
        }
      });
    });
  }

  getDb(userId = null) {
    if (userId) {
      // Return user-specific database
      if (this.userDbs.has(userId)) {
        return this.userDbs.get(userId);
      } else {
        // Create new connection to user database
        const dbPath = path.join(__dirname, '../data', `user_${userId}.db`);
        const userDb = new sqlite3.Database(dbPath);
        this.userDbs.set(userId, userDb);
        return userDb;
      }
    } else {
      // Return main database for users and authentication
      return this.mainDb;
    }
  }

  close() {
    // Close main database
    if (this.mainDb) {
      this.mainDb.close((err) => {
        if (err) {
          console.error('Error closing main database:', err.message);
        } else {
          console.log('Main database connection closed');
        }
      });
    }
    
    // Close all user databases
    this.userDbs.forEach((db, userId) => {
      db.close((err) => {
        if (err) {
          console.error(`Error closing user database ${userId}:`, err.message);
        } else {
          console.log(`User database ${userId} connection closed`);
        }
      });
    });
    this.userDbs.clear();
  }
}

module.exports = new Database();
