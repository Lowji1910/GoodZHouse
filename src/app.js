const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// API routes
const apiRouter = require('./routes');
const wishlistRouter = require('./routes/wishlist');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
app.use('/api', apiRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Optional: root message to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Backend OK. Visit /api/health or /api/products');
});

module.exports = app;

