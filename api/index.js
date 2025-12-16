// api/index.js - Node.js Backend for Vercel
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://yourusername.github.io', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'incomeplus-secure-key-2024';

// Demo Database (Replace with MySQL/PostgreSQL in production)
let users = [];
let scanners = [];

// Initialize demo data
function initDemoData() {
  // Demo users
  users = [
    {
      id: 1,
      email: 'demo@incomeplus.com',
      password: bcrypt.hashSync('demo123', 10),
      name: 'Demo User',
      username: 'demo_user',
      phone: '+91 9876543210',
      experience: 'intermediate',
      trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      subscription: 'trial'
    }
  ];

  // Demo scanners
  scanners = [
    { id: 1, name: 'Volume Spike Scanner', description: 'Detects unusual volume activity' },
    { id: 2, name: 'Breakout Scanner', description: 'Identifies price breakouts' },
    { id: 3, name: 'Support Resistance', description: 'Finds key support/resistance levels' },
    { id: 4, name: 'Moving Average Scanner', description: 'Tracks MA crossovers' },
    { id: 5, name: 'RSI Scanner', description: 'Identifies overbought/oversold conditions' }
  ];
}

initDemoData();

// ========== API ENDPOINTS ==========

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Incomeplus Scanner API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    scannersCount: scanners.length
  });
});

// 2. Login (replaces login.php)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials. Try: demo123' });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData,
      trialDaysLeft: Math.ceil((new Date(user.trialEnds) - new Date()) / (1000 * 60 * 60 * 24))
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. Register (replaces auth.php)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, username, password, phone, experience } = req.body;

    // Validation
    if (!name || !email || !username || !password || !experience) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    if (users.some(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      name,
      email,
      username,
      password: hashedPassword,
      phone: phone || '',
      experience,
      trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      subscription: 'trial',
      isActive: true
    };

    users.push(newUser);

    // Create token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userData } = newUser;

    res.status(201).json({
      success: true,
      message: 'Registration successful! 7-day free trial activated.',
      token,
      user: userData,
      trialDaysLeft: 7
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 4. Verify Token (replaces session check)
app.get('/api/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        trialEnds: user.trialEnds,
        subscription: user.subscription
      }
    });

  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// 5. Get User Profile
app.get('/api/profile/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userData } = user;
    res.json({ success: true, user: userData });

  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 6. Update Profile
app.put('/api/profile/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = parseInt(req.params.id);
    
    if (decoded.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user data
    const updates = req.body;
    users[userIndex] = { ...users[userIndex], ...updates };

    const { password, ...userData } = users[userIndex];
    res.json({ success: true, message: 'Profile updated', user: userData });

  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// 7. Get Scanners (replaces scanner.php)
app.get('/api/scanners', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      scanners: scanners,
      count: scanners.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 8. Run Scanner
app.post('/api/scanner/run', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET);
    const { scannerId } = req.body;

    // Demo scanner results
    const results = {
      scannerId,
      status: 'completed',
      results: [
        { symbol: 'RELIANCE', price: 2856.50, change: '+2.5%', volume: '5.2M' },
        { symbol: 'TCS', price: 3850.75, change: '+1.8%', volume: '3.8M' },
        { symbol: 'INFY', price: 1650.25, change: '+3.2%', volume: '4.5M' },
        { symbol: 'HDFCBANK', price: 1685.30, change: '+1.2%', volume: '6.1M' },
        { symbol: 'ICICIBANK', price: 1085.90, change: '+2.8%', volume: '8.3M' }
      ],
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Scanner completed successfully',
      ...results
    });

  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 9. Check Trial Status (replaces trial_check.php)
app.get('/api/trial-status', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const trialEnds = new Date(user.trialEnds);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
    const isActive = daysLeft > 0;

    res.json({
      success: true,
      trialEnds: user.trialEnds,
      daysLeft: Math.max(0, daysLeft),
      isActive,
      subscription: user.subscription,
      message: isActive 
        ? `Trial active. ${daysLeft} days remaining.` 
        : 'Trial expired. Please subscribe.'
    });

  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 10. Forgot Password
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json({ error: 'Email not found' });
  }

  res.json({
    success: true,
    message: `Password reset instructions sent to ${email}`,
    note: 'In production, an email would be sent with reset link'
  });
});

// 11. Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // In production, verify reset token from database
    // For demo, accept any token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// 12. Market Data
app.get('/api/market-data', (req, res) => {
  res.json({
    nifty: {
      price: 22456.85,
      change: 125.50,
      changePercent: 0.56
    },
    sensex: {
      price: 73845.12,
      change: 285.75,
      changePercent: 0.39
    },
    topGainers: [
      { symbol: 'RELIANCE', change: '+2.5%' },
      { symbol: 'TCS', change: '+1.8%' },
      { symbol: 'INFY', change: '+3.2%' }
    ],
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET  /api/health',
      'POST /api/login',
      'POST /api/register',
      'GET  /api/verify',
      'GET  /api/profile/:id',
      'GET  /api/scanners',
      'POST /api/scanner/run',
      'GET  /api/trial-status',
      'POST /api/forgot-password',
      'GET  /api/market-data'
    ]
  });
});

// Export for Vercel
module.exports = app;
