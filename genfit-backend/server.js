const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGO_URI;
const MONGO_RETRY_MS = 8000;
let isConnectingMongo = false;
let mongoLastError = null;

if (!MONGODB_URI) {
  console.error('❌ Missing MONGO_URI in backend .env file');
}

// Avoid buffering DB operations when disconnected. This makes auth failures explicit.
mongoose.set('bufferCommands', false);

const connectMongoWithRetry = async () => {
  if (!MONGODB_URI || isConnectingMongo || mongoose.connection.readyState === 1) {
    return;
  }

  isConnectingMongo = true;
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    mongoLastError = null;
    console.log('✅ MongoDB Connected');
  } catch (err) {
    mongoLastError = err;
    console.error('❌ MongoDB Connection Error:', err?.message || err);
    console.log(`🔁 Retrying MongoDB connection in ${MONGO_RETRY_MS / 1000}s...`);
    setTimeout(connectMongoWithRetry, MONGO_RETRY_MS);
  } finally {
    isConnectingMongo = false;
  }
};

connectMongoWithRetry();

// Connection monitoring
mongoose.connection.on("connected", () => {
  console.log("📦 Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  mongoLastError = err;
  console.log("❌ Mongoose error:", err?.message || err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected");
  setTimeout(connectMongoWithRetry, MONGO_RETRY_MS);
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'GenFit Backend API is running 🚀' });
});

// Health check route
app.get('/health', (req, res) => {
  const readyStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const mongoState = readyStateMap[mongoose.connection.readyState] || 'Unknown';

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoState,
    mongoError: mongoLastError?.message || null,
  });
});

// AUTH ROUTES
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// SYNC ROUTES
const syncRoutes = require('./routes/sync');
app.use('/api/sync', syncRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});