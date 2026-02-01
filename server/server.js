const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const setupWebSocket = require('./socket');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();
const server = http.createServer(app);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for simplicity in this demo (inline scripts/styles)
}));
app.use(cors({
    origin: true, // Allow all for dev/demo inside this env
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Limit each IP to 1000 requests per windowMs (high for demo interaction)
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Static Client
app.use(express.static(path.join(__dirname, '../client/public')));

// Fallback for SPA
app.get('*', (req, res) => {
    // If request accepts html
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../client/public/index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Setup WebSocket
setupWebSocket(server);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = server; // Export for testing
