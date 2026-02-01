const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateTokens } = require('../utils/auth');
const redis = require('../redis');
const { v4: uuidv4 } = require('uuid');

router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await hashPassword(password);
        const id = uuidv4();
        
        db.run(
            `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
            [id, username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({ error: 'Username or email already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'User created successfully' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await comparePassword(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const { accessToken } = generateTokens(user);
        
        // Store session
        const sessionId = uuidv4();
        await redis.set(`sess:${sessionId}`, user.id, { EX: 60 * 60 * 24 * 7 }); // 7 days

        // Set refresh cookie
        res.cookie('refreshToken', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken, user: { id: user.id, username: user.username, email: user.email } });
    });
});

router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const userId = await redis.get(`sess:${refreshToken}`);
    if (!userId) return res.status(403).json({ error: 'Invalid refresh token' });

    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) return res.status(403).json({ error: 'User not found' });
        
        const { accessToken } = generateTokens(user);
        res.json({ accessToken });
    });
});

router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await redis.del(`sess:${refreshToken}`);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});

module.exports = router;
