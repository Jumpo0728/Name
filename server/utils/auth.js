const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
    
    // Refresh token is just a random string or long-lived JWT, handled by session
    return { accessToken };
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    generateTokens,
    verifyToken,
    JWT_SECRET
};
