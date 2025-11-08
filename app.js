const express = require('express');
const cors = require('cors');
const cacheMiddleware = require('./src/middleware/cache');
const { apiLimiter, productsLimiter } = require('./src/middleware/rateLimiter');
const app = express();

// CORS middleware
app.use(cors());

// JSON parser
app.use(express.json());

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/products', productsLimiter);

// Basic health check
app.get('/health', (req, res) => res.json({ ok: true }));

// API routes with caching for specific endpoints
app.use('/api/categories', cacheMiddleware(300), require('./src/routes/categories'));
app.use('/api/products', cacheMiddleware(60), require('./src/routes/products'));
app.use('/api/reviews/stats', cacheMiddleware(300), require('./src/routes/reviews'));
app.use('/api', require('./src/routes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;