require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/event_tracker';

// ── Middleware ──────────────────────────────────────────────────────────────

// CORS — allow all origins (required for file:// and cross-origin demo pages)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicit preflight for all routes

// Parse application/json (used by fetch with Content-Type: application/json)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Parse text/plain — sendBeacon() sometimes sends Content-Type: text/plain
// even when the body is a JSON string. We re-parse it into req.body here.
app.use((req, _res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('text/plain')) {
    let raw = '';
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', () => {
      try {
        req.body = JSON.parse(raw);
        console.log('[server] text/plain body parsed as JSON ✓');
      } catch (e) {
        console.warn('[server] text/plain body was not valid JSON:', raw.slice(0, 120));
      }
      next();
    });
  } else {
    next();
  }
});

// Request logger
app.use((req, _res, next) => {
  const preview = req.body ? JSON.stringify(req.body).slice(0, 120) : '(empty)';
  const ct = req.headers['content-type'] || 'none';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | CT: ${ct} | ${preview}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/events', eventsRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Database ────────────────────────────────────────────────────────────────
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;