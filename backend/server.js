const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Setup WebSockets
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Store io reference globally in app config so controllers can access it
app.set('socketio', io);

// Load socket handler logic
require('./sockets/socketHandler')(io);

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local static files/avatars in dev
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', apiLimiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/tasks', require('./routes/tasks'));
app.use('/api/v1/workspaces', require('./routes/workspaces'));
app.use('/api/v1/comments', require('./routes/comments'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/ai', require('./routes/ai'));

// Root page diagnostics
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aurora Task Management API - Active',
    time: new Date()
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to DB and start Server
const startServer = async () => {
  // Connect to Database (or configure Fallback JSON Db)
  await connectDB();
  
  server.listen(PORT, () => {
    console.log('\x1b[35m%s\x1b[0m', `🚀 Server floating in aurora skies on port ${PORT}...`);
  });
};

startServer();
