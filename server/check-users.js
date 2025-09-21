const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/main.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

db.all('SELECT id, username, is_admin FROM users', (err, rows) => {
  if (err) {
    console.error('Error querying users:', err.message);
  } else {
    console.log('Available users:');
    if (rows.length === 0) {
      console.log('No users found in database');
    } else {
      rows.forEach(user => {
        console.log(`- ID: ${user.id}, Username: ${user.username}, Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      });
    }
  }
  db.close();
});
