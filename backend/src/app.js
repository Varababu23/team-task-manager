require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ============================
// CORS CONFIGURATION
// ============================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://team-task-manager-pp3ol76o0-juvvalaprasad158-9371s-projects.vercel.app',
  'https://team-task-manager-git-main-juvvalaprasad158-9371s-projects.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Temporary production-safe allow
    return callback(null, true);
  },
  credentials: true,
}));

// ============================
// MIDDLEWARE
// ============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// API HEALTH CHECK
// ============================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ============================
// ROUTES
// ============================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ============================
// ROOT ROUTE
// ============================
app.get('/', (req, res) => {
  res.send('🚀 Team Task Manager Backend Running Successfully');
});

// ============================
// ERROR HANDLER
// ============================
app.use((err, req, res, next) => {
  console.error('Global Error:', err.message);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ============================
// SERVER START
// ============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});