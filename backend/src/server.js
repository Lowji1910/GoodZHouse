require('dotenv').config();
const app = require('./app');
const http = require('http');
const { initSocket } = require('./realtime/socket');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

(async () => {
  try {
    await connectDB(MONGODB_URI);
    const server = http.createServer(app);
    initSocket(server);
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

