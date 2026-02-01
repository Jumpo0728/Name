const { verifyToken } = require('../utils/auth');
const redis = require('../redis');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Access token required' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(403).json({ error: 'Invalid or expired token' });

    // Optional: Check if session is still active in Redis (blacklist check)
    // const session = await redis.get(`sess:${decoded.id}`);
    // if (!session) return res.status(403).json({ error: 'Session expired' });

    req.user = decoded;
    next();
}

module.exports = authenticateToken;
