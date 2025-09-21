const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/main.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

console.log('Checking players in database...');

db.all('SELECT id, name, created_at FROM players ORDER BY created_at DESC', (err, rows) => {
  if (err) {
    console.error('Error querying players:', err.message);
  } else {
    console.log('Players in database:');
    if (rows.length === 0) {
      console.log('No players found in database');
    } else {
      rows.forEach(player => {
        console.log(`- ID: ${player.id}, Name: "${player.name}", Created: ${player.created_at}`);
      });
    }
  }
  db.close();
});
