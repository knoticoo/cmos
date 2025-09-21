const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

// Get patch notes (public)
router.get('/', async (req, res) => {
  try {
    // For now, we'll store patch notes in a simple JSON file
    // In a real app, you might want to store this in the database
    const fs = require('fs');
    const path = require('path');
    const patchNotesPath = path.join(__dirname, '../data/patch-notes.json');
    
    let patchNotes = '';
    try {
      if (fs.existsSync(patchNotesPath)) {
        const data = fs.readFileSync(patchNotesPath, 'utf8');
        const jsonData = JSON.parse(data);
        patchNotes = jsonData.patchNotes || '';
      }
    } catch (err) {
      console.error('Error reading patch notes file:', err);
    }
    
    res.json({ patchNotes });
  } catch (error) {
    console.error('Error in patch notes endpoint:', error);
    res.status(500).json({ message: 'Error fetching patch notes: ' + error.message });
  }
});

// Update patch notes (admin only)
router.put('/', authenticateToken, async (req, res) => {
  try {
    console.log('Patch notes update request:', req.body);
    console.log('User:', req.user);
    
    // Basic admin check
    if (!req.user.isAdmin && !req.user.is_admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const { patchNotes } = req.body;
    
    if (!patchNotes) {
      return res.status(400).json({ message: 'Patch notes content is required' });
    }
    
    // Save to JSON file
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '../data');
    const patchNotesPath = path.join(dataDir, 'patch-notes.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const data = {
      patchNotes: patchNotes,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.username
    };
    
    fs.writeFileSync(patchNotesPath, JSON.stringify(data, null, 2));
    
    res.json({ 
      message: 'Patch notes updated successfully',
      updatedAt: data.updatedAt,
      updatedBy: data.updatedBy
    });
  } catch (error) {
    console.error('Error updating patch notes:', error);
    res.status(500).json({ message: 'Error updating patch notes: ' + error.message });
  }
});

module.exports = router;
