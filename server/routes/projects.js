const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../middleware/auth');

// Get all projects for user
router.get('/', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create project
router.post('/', authenticateToken, (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name required' });
    
    const id = uuidv4();
    db.run(`INSERT INTO projects (id, owner_id, name) VALUES (?, ?, ?)`, [id, req.user.id, name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Create default file
        const fileId = uuidv4();
        db.run(`INSERT INTO files (id, project_id, path, content) VALUES (?, ?, ?, ?)`, 
            [fileId, id, 'main.js', '// Welcome to MegaCollab\nconsole.log("Hello World");'],
            (err) => {
                if (err) console.error('Failed to create default file', err);
            }
        );
        
        res.status(201).json({ id, name, owner_id: req.user.id });
    });
});

// Get project files
router.get('/:id/files', authenticateToken, (req, res) => {
    // Check access (owner only for now)
    db.get(`SELECT * FROM projects WHERE id = ? AND owner_id = ?`, [req.params.id, req.user.id], (err, project) => {
        if (err || !project) return res.status(404).json({ error: 'Project not found' });
        
        db.all(`SELECT id, path, updated_at FROM files WHERE project_id = ?`, [req.params.id], (err, files) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(files);
        });
    });
});

// Get file content
router.get('/:projectId/files/:fileId', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM files WHERE id = ? AND project_id = ?`, [req.params.fileId, req.params.projectId], (err, file) => {
        if (err || !file) return res.status(404).json({ error: 'File not found' });
        res.json(file);
    });
});

// Create file
router.post('/:id/files', authenticateToken, (req, res) => {
    const { path: filePath } = req.body;
    const fileId = uuidv4();
    
    db.run(`INSERT INTO files (id, project_id, path, content) VALUES (?, ?, ?, ?)`, 
        [fileId, req.params.id, filePath, ''],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: fileId, path: filePath });
        }
    );
});

// Delete file
router.delete('/:projectId/files/:fileId', authenticateToken, (req, res) => {
    db.run(`DELETE FROM files WHERE id = ? AND project_id = ?`, [req.params.fileId, req.params.projectId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Deleted' });
    });
});

module.exports = router;
