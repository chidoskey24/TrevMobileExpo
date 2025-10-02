// Simple HTTP server for TrevMobile API
// This runs as a separate Node.js process to serve the web dashboard

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for development
const mockData = {
  drivers: [
    { driverId: '1', driverName: 'John Doe', totalPaid: 15000, totalTransactions: 45, lastTransaction: '2024-01-15', status: 'active' },
    { driverId: '2', driverName: 'Jane Smith', totalPaid: 12000, totalTransactions: 38, lastTransaction: '2024-01-14', status: 'active' },
    { driverId: '3', driverName: 'Mike Johnson', totalPaid: 8000, totalTransactions: 25, lastTransaction: '2024-01-10', status: 'inactive' }
  ],
  receipts: [
    { id: '1', driverId: '1', amount: 500, status: 'paid', date: '2024-01-15' },
    { id: '2', driverId: '2', amount: 750, status: 'paid', date: '2024-01-14' },
    { id: '3', driverId: '1', amount: 300, status: 'queued', date: '2024-01-13' }
  ],
  statistics: {
    totalDrivers: 3,
    activeDrivers: 2,
    totalRevenue: 35000,
    todayTransactions: 5,
    queuedPayments: 1,
    failedPayments: 0
  },
  systemStatus: {
    isOnline: true,
    unsyncedCount: 0,
    databaseStatus: 'healthy',
    blockchainStatus: 'connected',
    lastSync: new Date().toISOString(),
    connectedDevices: 1
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  // For development, accept any token
  if (token === 'mock-token' || token.startsWith('Bearer')) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      data: {
        token: 'mock-token',
        username: 'admin',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/drivers', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockData.drivers
  });
});

app.get('/api/receipts', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockData.receipts
  });
});

app.get('/api/queue', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockData.receipts.filter(r => r.status === 'queued')
  });
});

app.get('/api/statistics', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockData.statistics
  });
});

app.get('/api/status', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: mockData.systemStatus
  });
});

app.post('/api/drivers/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const driver = mockData.drivers.find(d => d.driverId === id);
  if (driver) {
    driver.status = status;
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Driver not found' });
  }
});

app.get('/api/realtime/status', (req, res) => {
  res.json({
    success: true,
    data: { isRunning: true, lastUpdate: {} }
  });
});

app.post('/api/realtime/trigger', (req, res) => {
  res.json({ success: true });
});

app.get('/api/sync/status', (req, res) => {
  res.json({
    success: true,
    data: {
      lastSync: new Date().toLocaleString(),
      status: 'synced',
      unsyncedCount: 0,
      lastAttempt: new Date().toLocaleString(),
      error: null
    }
  });
});

app.post('/api/sync/trigger', (req, res) => {
  res.json({ success: true });
});

app.get('/api/sync/data', (req, res) => {
  res.json({
    success: true,
    data: {
      unsyncedTransactions: [],
      queuedPayments: mockData.receipts.filter(r => r.status === 'queued')
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`TrevMobile API Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/drivers');
  console.log('- GET /api/receipts');
  console.log('- GET /api/statistics');
  console.log('- GET /api/status');
  console.log('- GET /health');
});
