// js/auth.js - Updated for Node.js Backend
const API_BASE_URL = 'https://incomeplus-scanner-api.vercel.app/api'; // Your Vercel URL

class AuthService {
  constructor() {
    this.token = localStorage.getItem('incomeplus_token');
    this.user = JSON.parse(localStorage.getItem('incomeplus_user') || 'null');
    this.isDemoMode = false;
  }

  // Test backend connection
  async testConnection() {
    try {
      console.log('Testing backend connection to:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backend connected:', data);
      this.isDemoMode = false;
      return { connected: true, data, demo: false };

    } catch (error) {
      console.warn('⚠️ Backend offline, using demo mode:', error.message);
      this.isDemoMode = true;
      return { connected: false, demo: true, error: error.message };
    }
  }

  // Login user
  async login(email, password, rememberMe = false) {
    try {
      console.log('Attempting login for:', email);
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success) {
        this.saveAuthData(data.token, data.user, rememberMe);
        return {
          success: true,
          user: data.user,
          token: data.token,
          message: data.message,
          demo: false
        };
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
          demo: false
        };
      }

    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to demo mode
      if (email && password === 'demo123') {
        const demoUser = this.createDemoUser(email);
        this.saveAuthData('demo-token-' + Date.now(), demoUser, rememberMe);
        return {
          success: true,
          user: demoUser,
          token: 'demo-token',
          message: 'Logged in (Demo Mode)',
          demo: true
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error',
        demo: this.isDemoMode
      };
    }
  }

  // Register new user
  async register(userData) {
    try {
      console.log('Registering new user:', userData.email);
      
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.success) {
        this.saveAuthData(data.token, data.user, true);
        return {
          success: true,
          user: data.user,
          token: data.token,
          message: data.message,
          demo: false
        };
      } else {
        return {
          success: false,
          error: data.error || 'Registration failed',
          demo: false
        };
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      // Fallback to demo mode
      const demoUser = this.createDemoUser(userData.email, userData);
      this.saveAuthData('demo-token-' + Date.now(), demoUser, true);
      return {
        success: true,
        user: demoUser,
        token: 'demo-token',
        message: 'Account created (Demo Mode)',
        demo: true
      };
    }
  }

  // Verify token
  async verifyToken() {
    if (!this.token || this.token.startsWith('demo-token')) {
      return { valid: false, demo: true };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return data.valid ? { valid: true, user: data.user, demo: false } : { valid: false, demo: false };

    } catch (error) {
      console.warn('Token verification failed:', error);
      return { valid: false, demo: this.isDemoMode };
    }
  }

  // Save auth data to localStorage
  saveAuthData(token, user, rememberMe) {
    this.token = token;
    this.user = user;
    
    localStorage.setItem('incomeplus_token', token);
    localStorage.setItem('incomeplus_user', JSON.stringify(user));
    
    if (rememberMe) {
      localStorage.setItem('incomeplus_remember', 'true');
      localStorage.setItem('incomeplus_email', user.email);
    } else {
      sessionStorage.setItem('incomeplus_token', token);
      sessionStorage.setItem('incomeplus_user', JSON.stringify(user));
    }
  }

  // Create demo user (fallback)
  createDemoUser(email, userData = {}) {
    return {
      id: Date.now(),
      email: email,
      name: userData.name || 'Demo User',
      username: userData.username || 'demo_' + Math.random().toString(36).substr(2, 5),
      experience: userData.experience || 'beginner',
      trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      subscription: 'trial',
      isDemo: true
    };
  }

  // Logout
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('incomeplus_token');
    localStorage.removeItem('incomeplus_user');
    localStorage.removeItem('incomeplus_remember');
    sessionStorage.clear();
    window.location.href = 'login.html';
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!(this.token && this.user);
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get auth headers
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}

// Create global auth instance
window.authService = new AuthService();
