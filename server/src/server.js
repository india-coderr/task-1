const dotenv = require('dotenv');
// Load environment variables before any other imports
dotenv.config();

// Patch Express to automatically catch all async router errors
require('express-async-errors');

// Prevent unexpected process terminations from unhandled rejections / socket drops
process.on('unhandledRejection', (reason) => {
  console.error('[Process Warning - Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Error - Uncaught Exception]', err.message || err);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const AppError = require('./utils/errors');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const reportRoutes = require('./routes/report.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Disable ETags for real-time POS transactional data to avoid 304 Not Modified
app.set('etag', false);

// Security and standard middlewares
app.use(helmet());
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
// Flexible CORS supporting local development and deployed Vercel frontends
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow localhost, 127.0.0.1, or any vercel.app deployment
      if (
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Foodly Kitchen POS API Server',
    status: 'online',
    health: '/api/health',
    docs: 'https://github.com/logics-dev/foodly-kitchen-pos#readme'
  });
});

// Health check endpoint (always available even if DB is reconnecting)
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB(1, 500);
    } catch (e) {
      // Silent on health check
    }
  }
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      database: dbConnected ? 'connected' : 'connecting_or_waiting_ip_whitelist',
      timestamp: new Date().toISOString(),
      service: 'Foodly Kitchen POS API'
    }
  });
});

// Ensure database connection for serverless cold-starts & guard API routes
app.use('/api', async (req, res, next) => {
  const mongoose = require('mongoose');
  if (req.path === '/health') return next();

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB(2, 1000);
    } catch (err) {
      console.error('[Database Connect Attempt Failed]:', err.message);
    }
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'MongoDB is connecting or your current IP is not whitelisted in MongoDB Atlas.',
        details: [
          'If ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR occurred: log in to https://cloud.mongodb.com',
          'Go to Security > Network Access and click "+ Add IP Address"',
          'Select "Allow Access From Anywhere" (0.0.0.0/0) so cloud servers can connect.'
        ]
      }
    });
  }
  next();
});

// API Routes mounting
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Catch-all for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint '${req.originalUrl}' does not exist on this server.`, 404, 'ROUTE_NOT_FOUND'));
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Resilient server startup
function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Foodly Kitchen Restaurant POS Server Running `);
    console.log(` Port: ${PORT}                                  `);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
    console.log(` URL: http://localhost:${PORT}                  `);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${PORT} is already in use.`);
      console.error(`[Resolution] Terminate the conflicting process on port ${PORT} or configure a different PORT in server/.env.`);
      process.exit(1);
    } else {
      console.error('[Server Error] Server socket error:', err.message);
    }
  });

  // Initiate database connection with resilient background retries
  connectDB().catch((err) => {
    console.error('[Database Warning] Initial connection attempt:', err.message);
    console.error('[Database Guide] Whitelist your IP in MongoDB Atlas (Network Access > Allow from Anywhere: 0.0.0.0/0).');
  });

  // Continually attempt to reconnect in the background if disconnected
  setInterval(async () => {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 0) {
      try {
        await connectDB(1, 1000);
      } catch (e) {
        // Silent background retry
      }
    }
  }, 5000);

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
