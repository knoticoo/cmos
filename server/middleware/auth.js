const jwt = require('jsonwebtoken');
const database = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin && !req.user.is_admin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const getUserDatabase = async (userId) => {
  return new Promise((resolve, reject) => {
    const db = database.getDb(); // Main database
    db.get(
      'SELECT database_name FROM user_databases WHERE user_id = ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row.database_name);
        } else {
          // If no database entry exists, create one
          const dbName = `user_${userId}`;
          db.run(
            'INSERT INTO user_databases (user_id, database_name) VALUES (?, ?)',
            [userId, dbName],
            function(err) {
              if (err) {
                reject(err);
              } else {
                // Initialize the user database
                database.initializeUserDatabase(userId).then(() => {
                  resolve(dbName);
                }).catch(reject);
              }
            }
          );
        }
      }
    );
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  getUserDatabase
};
