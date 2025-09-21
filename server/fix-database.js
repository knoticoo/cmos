const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Fix all user databases
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');

fs.readdir(dataDir, (err, files) => {
  if (err) {
    console.error('Error reading data directory:', err);
    return;
  }

  const userDbs = files.filter(file => file.startsWith('user_') && file.endsWith('.db'));
  console.log('Found user databases:', userDbs);

  userDbs.forEach(dbFile => {
    const dbPath = path.join(dataDir, dbFile);
    console.log(`\nFixing database: ${dbFile}`);
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(`Error opening ${dbFile}:`, err);
        return;
      }
      
      // Check current players
      db.all('SELECT id, name FROM players ORDER BY id', (err, players) => {
        if (err) {
          console.error(`Error querying players in ${dbFile}:`, err);
          return;
        }
        
        console.log(`Current players in ${dbFile}:`, players);
        
        // Fix the auto-increment sequence
        db.run('DELETE FROM sqlite_sequence WHERE name = "players"', (err) => {
          if (err) {
            console.log(`Error deleting sequence for ${dbFile}:`, err);
          } else {
            console.log(`Reset sequence for ${dbFile}`);
          }
          
          // Set the sequence to the correct value
          if (players.length > 0) {
            const maxId = Math.max(...players.map(p => p.id));
            db.run(`INSERT INTO sqlite_sequence (name, seq) VALUES ('players', ${maxId})`, (err) => {
              if (err) {
                console.log(`Error setting sequence for ${dbFile}:`, err);
              } else {
                console.log(`Set sequence for ${dbFile} to ${maxId}`);
              }
              
              db.close();
            });
          } else {
            db.close();
          }
        });
      });
    });
  });
});
