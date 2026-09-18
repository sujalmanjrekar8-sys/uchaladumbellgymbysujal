const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from frontend folder
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Direct HTML Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/owner/dashboard.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'owner/dashboard.html'));
});

app.get('/trainer/dashboard.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'trainer/dashboard.html'));
});

app.get('/member/dashboard.html', (req, res) => {
  res.sendFile(path.join(frontendPath, 'member/dashboard.html'));
});

// Import API Routes
const authRoutes = require('./routes/authRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const memberRoutes = require('./routes/memberRoutes');

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/trainer', trainerRoutes);
app.use('/api/member', memberRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    gym: 'UCHALA DUMBELL GYM BY SUJAL',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 UCHALA DUMBELL GYM SERVER ACTIVE ON PORT ${PORT}`);
  console.log(`🌐 Public Website:   http://localhost:${PORT}/index.html`);
  console.log(`🔐 Login Gateway:    http://localhost:${PORT}/login.html`);
  console.log(`👑 Owner Portal:     http://localhost:${PORT}/owner/dashboard.html`);
  console.log(`🏋️ Trainer Portal:   http://localhost:${PORT}/trainer/dashboard.html`);
  console.log(`🏃 Member Portal:    http://localhost:${PORT}/member/dashboard.html`);
  console.log(`=======================================================`);
});