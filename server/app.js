// server/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const twilio = require('twilio');
const nodemailer = require('nodemailer');

const app = express();
const db = new Database('queuewise.db');
const otps = new Map(); // In-memory OTP store

// Twilio & Nodemailer config
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE = process.env.TWILIO_PHONE;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Auto-clean expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [id, { expiresAt }] of otps.entries()) {
    if (now > expiresAt) otps.delete(id);
  }
}, 60 * 1000);

// Routes
const authRoutes = require('./routes/auth')(db);
const otpRoutes = require('./routes/otp')(db, otps, twilioClient, TWILIO_PHONE, transporter);

app.use('/api', authRoutes);
app.use('/api', otpRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
