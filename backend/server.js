require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging for workshop debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);

// Root test endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Expense Splitter API',
    status: 'online',
    minimothConfigured: Boolean(process.env.MINIMOTH_API_KEY && process.env.MINIMOTH_API_KEY !== 'mock')
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` Expense Splitter Backend listening on port ${PORT}`);
  console.log(` API Base URL: http://localhost:${PORT}/api`);
  console.log(` MiniMoth Mode: ${process.env.MINIMOTH_API_KEY && process.env.MINIMOTH_API_KEY !== 'mock' ? 'Live API Key Loaded' : 'Sandbox/Demo Mode (OTP: 123456)'}`);
  console.log(`======================================================\n`);
});

