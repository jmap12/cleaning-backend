const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// ROUTES
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();

// ---------- SECURITY MIDDLEWARE ----------
app.use(helmet());
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));
app.use(express.json({ limit: "10mb" }));

// Apply rate limiting (prevents abuse)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
}));

// ---------- ROUTE REGISTRATION ----------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ---------- 404 HANDLER ----------
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
