require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const connectDB = require('./src/config/db');

// Initialize App
const app = express();
const server = http.createServer(app);

// Socket.io for Real-time
const io = new Server(server, {
    cors: { origin: '*' } // Update in production to specific frontend Origin
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from Next.js build
const staticPath = path.join(__dirname, '../client/.next/static');
app.use('/_next/static', express.static(staticPath, { dotfiles: 'allow' }));

const publicPath = path.join(__dirname, '../client/public');
app.use(express.static(publicPath));

// Database Connection
connectDB();

// Routes
const authRoutes = require('./src/routes/auth');
const donationRoutes = require('./src/routes/donations');
const volunteerRoutes = require('./src/routes/volunteers');
const requestRoutes = require('./src/routes/requests');
const deliveryRoutes = require('./src/routes/deliveries');
const adminRoutes = require('./src/routes/admin');
const adRoutes = require('./src/routes/ads');
const adWatchRoutes = require('./src/routes/adWatch');

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ad-watch', adWatchRoutes);
app.use('/api/ads', adRoutes);

const notificationRoutes = require('./src/routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Root Route - API info
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to KindBridge API',
        endpoints: {
            auth: '/api/auth',
            donations: '/api/donations',
            volunteers: '/api/volunteers',
            requests: '/api/requests',
            deliveries: '/api/deliveries',
            admin: '/api/admin',
            adWatch: '/api/ad-watch',
            notifications: '/api/notifications',
            health: '/api/health'
        }
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'KindBridge API is running' });
});

// Serve frontend
const nextBuildDir = path.join(__dirname, '../client/.next');
const fs = require('fs');
const indexHtmlPath = path.join(__dirname, '../client/.next/server/app/page.html');

// Catch-all middleware for frontend routes
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // 1. Try serving the exact Next.js build file (e.g., / -> /index.html)
    let pagePath = req.path === '/' ? '/index.html' : req.path;
    // Add .html if it has no extension, to match Next.js App router build
    if (!path.extname(pagePath)) {
        pagePath += '.html';
    }

    const exactHtmlPath = path.join(__dirname, '../client/.next/server/app', pagePath);
    console.log(`[StaticServe] req.path=${req.path} -> exactHtmlPath: ${exactHtmlPath} (Exists: ${fs.existsSync(exactHtmlPath)})`);
    if (fs.existsSync(exactHtmlPath) && fs.statSync(exactHtmlPath).isFile()) {
        return res.sendFile(exactHtmlPath, { dotfiles: 'allow' });
    }

    // 2. Client-side navigation requests might want actual path files without HTML, try checking direct path (for e.g., RSC)
    const directPath = path.join(__dirname, '../client/.next/server/app', req.path);
    console.log(`[StaticServe] directPath: ${directPath} (Exists: ${fs.existsSync(directPath)})`);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
        return res.sendFile(directPath, { dotfiles: 'allow' });
    }
    
    // 3. Otherwise serve index.html for client-side routing fallback
    const indexPath = path.join(__dirname, '../client/.next/server/app/index.html');
    console.log(`[StaticServe] indexPath: ${indexPath} (Exists: ${fs.existsSync(indexPath)})`);
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath, { dotfiles: 'allow' });
    }
    
    console.log(`[StaticServe] ALL FAILED, returning 404 JSON for ${req.path}`);
    return res.status(404).json({ error: 'Not found' });
});

// Make io accessible to route handlers via req.app.get('io')
app.set('io', io);

// Placeholder socket logic
io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User joins their personal room (userId) for targeted events
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`👤 User ${userId} joined their room`);
        }
    });

    // User joins a role-based room (e.g., 'role:admin', 'role:volunteer')
    socket.on('joinRole', (role) => {
        if (role) {
            socket.join(`role:${role}`);
            console.log(`🏷️  Socket ${socket.id} joined role room: ${role}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 KindBridge Backend Server running on port ${PORT}`);
});
