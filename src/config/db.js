const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error('Missing MONGODB_URI. Please set it in backend/.env');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri);

  console.log('MongoDB connected:', mongoose.connection.host);
  return mongoose.connection;
}

module.exports = { connectDB };

