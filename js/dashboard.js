// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Load scanner cards
    loadScannerCards();
    
    // Load recent results
    loadRecentResults();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const nav = document.querySelector('.dashboard-nav');
            nav.classList.toggle('show');
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Run quick scan button
    const runScanBtn = document.querySelector('.btn-run-scan');
    if (runScanBtn) {
        runScanBtn.addEventListener('click', function() {
            runQuickScan();
        });
    }
    
    // Initialize tooltips
    initializeTooltips();
});

// Check if user is authenticated
function checkAuth() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        // Redirect to login
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    
    // Check if subscription is active
    const userData = JSON.parse(user);
    const today = new Date();
    const subscriptionEnd = new Date(userData.subscription_end);
    
    if (subscriptionEnd < today) {
        // Subscription expired
        if (!window.location.pathname.includes('subscription.html')) {
            window.location.href = 'subscription.html?expired=true';
        }
    }
}

// Load user data
function loadUserData() {
    const user = localStorage.getItem('user');
    if (!user) return;
    
    const userData = JSON.parse(user);
    
    // Update user info in top bar
    const userNameElement = document.querySelector('.user-name');
    const userFirstNameElement = document.getElementById('userFirstName');
    const planBadge = document.querySelector('.plan-badge');
    const planExpiry = document.querySelector('.plan-expiry');
    const currentPlanElement = document.getElementById('currentPlan');
    const expiresInElement = document.getElementById('expiresIn');
    
    if (userData.name) {
        const firstName = userData.name.split(' ')[0];
        if (userFirstNameElement) userFirstNameElement.textContent = firstName;
        if (userNameElement) userNameElement.textContent = userData.name;
    }
    
    if (userData.subscription_type) {
        const planName = userData.subscription_type.charAt(0).toUpperCase() + userData.subscription_type.slice(1);
        if (planBadge) planBadge.textContent = planName;
        if (currentPlanElement) currentPlanElement.textContent = planName + ' Plan';
    }
    
    if (userData.subscription_end) {
        const endDate = new Date(userData.subscription_end);
        const today = new Date();
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        if (planExpiry) {
            planExpiry.textContent = 'Expires: ' + endDate.toLocaleDateString();
        }
        
        if (expiresInElement) {
            expiresInElement.textContent = daysLeft + ' days';
        }
        
        // Update days left in stats
        const daysLeftElement = document.getElementById('daysLeft');
        if (daysLeftElement) {
            daysLeftElement.textContent = daysLeft;
        }
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        // Mock API call - Replace with actual API
        const stats = await fetchDashboardStats();
        
        // Update stats
        const todayScansElement = document.getElementById('todayScans');
        const activeAlertsElement = document.getElementById('activeAlerts');
        const accuracyRateElement = document.getElementById('accuracyRate');
        const scansUsedElement = document.getElementById('scansUsed');
        
        if (todayScansElement) todayScansElement.textContent = stats.todayScans;
        if (activeAlertsElement) activeAlertsElement.textContent = stats.activeAlerts;
        if (accuracyRateElement) accuracyRateElement.textContent = stats.accuracyRate + '%';
        if (scansUsedElement) scansUsedElement.textContent = stats.scansUsed + '/1000';
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load scanner cards
async function loadScannerCards() {
    const scannersContainer = document.querySelector('.scanners-container');
    if (!scannersContainer) return;
    
    try {
        const scanners = await fetchScanners();
        
        scannersContainer.innerHTML = scanners.map(scanner => `
            <a href="${scanner.url}" class="scanner-card">
                <div class="scanner-card-header">
                    <div class="scanner-card-icon">
                        <i class="${scanner.icon}"></i>
                    </div>
                    <h3>${scanner.name}</h3>
                </div>
                <p>${scanner.description}</p>
                <div class="scanner-card-footer">
                    <div class="scanner-stats">
                        <div class="stat">
                            <i class="fas fa-bolt"></i>
                            <span>${scanner.speed}</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-chart-line"></i>
                            <span>${scanner.accuracy}%</span>
                        </div>
                    </div>
                    <div class="scanner-action">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Error loading scanners:', error);
        scannersContainer.innerHTML = '<div class="error-message">Failed to load scanners. Please try again.</div>';
    }
}

// Load recent scan results
async function loadRecentResults() {
    const resultsBody = document.getElementById('recentResultsBody');
    if (!resultsBody) return;
    
    try {
        const results = await fetchRecentResults();
        
        if (results.length === 0) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #718096;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        No scan results yet. Run your first scan!
                    </td>
                </tr>
            `;
            return;
        }
        
        resultsBody.innerHTML = results.map(result => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="${result.icon}" style="color: #4f46e5;"></i>
                        <span>${result.scanner}</span>
                    </div>
                </td>
                <td>
                    <strong>${result.stock}</strong>
                </td>
                <td>
                    <span class="signal-badge ${result.signalClass}">${result.signal}</span>
                </td>
                <td>
                    <div class="confidence-cell">
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${result.confidence}%"></div>
                        </div>
                        <span>${result.confidence}%</span>
                    </div>
                </td>
                <td>
                    <span style="color: #718096; font-size: 0.9rem;">${result.time}</span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent results:', error);
        resultsBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 30px; color: #fc5c65;">
                    <i class="fas fa-exclamation-circle"></i>
                    Failed to load results
                </td>
            </tr>
        `;
    }
}

// Run quick scan
async function runQuickScan() {
    const btn = document.querySelector('.btn-run-scan');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    btn.disabled = true;
    
    try {
        // Simulate scan
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success message
        showNotification('Quick scan completed! Found 3 new signals.', 'success');
        
        // Refresh recent results
        loadRecentResults();
        loadDashboardStats();
    } catch (error) {
        showNotification('Scan failed. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Initialize tooltips
function initializeTooltips() {
    // Add tooltip functionality to elements with data-tooltip attribute
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltipText = this.getAttribute('data-tooltip');
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Use the notification system from main.js if available
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            }
            
            .notification-content {
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                max-width: 400px;
            }
            
            .notification-success .notification-content {
                border-left: 4px solid #10b981;
            }
            
            .notification-error .notification-content {
                border-left: 4px solid #fc5c65;
            }
            
            .notification-warning .notification-content {
                border-left: 4px solid #f59e0b;
            }
            
            .notification-info .notification-content {
                border-left: 4px solid #3b82f6;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #718096;
                cursor: pointer;
                margin-left: auto;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Logout function
function logout() {
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login
    window.location.href = 'login.html?logout=true';
}

// Mock API functions (Replace with actual API calls)
async function fetchDashboardStats() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
        todayScans: Math.floor(Math.random() * 50) + 10,
        activeAlerts: Math.floor(Math.random() * 10) + 1,
        accuracyRate: Math.floor(Math.random() * 30) + 70,
        scansUsed: Math.floor(Math.random() * 500) + 50
    };
}

async function fetchScanners() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
        {
            name: 'Volume-Price Scanner',
            description: 'Detects volume-price divergence and correlation patterns',
            icon: 'fas fa-wave-square',
            url: 'scanners/volume-price.html',
            speed: 'Real-time',
            accuracy: 82
        },
        {
            name: 'Breakout Scanner',
            description: 'Identifies price breakouts from consolidation',
            icon: 'fas fa-arrow-up-from-bracket',
            url: 'scanners/breakout.html',
            speed: 'Real-time',
            accuracy: 78
        },
        {
            name: 'Momentum Scanner',
            description: 'Finds stocks with strong momentum signals',
            icon: 'fas fa-rocket',
            url: 'scanners/momentum.html',
            speed: 'Real-time',
            accuracy: 75
        },
        {
            name: 'Support-Resistance Scanner',
            description: 'Detects key support and resistance levels',
            icon: 'fas fa-chart-area',
            url: 'scanners/support-resistance.html',
            speed: '5 min',
            accuracy: 85
        }
    ];
}

async function fetchRecentResults() {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const stocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
    const signals = ['Bullish', 'Bearish', 'Neutral'];
    const scanners = [
        { name: 'Volume-Price', icon: 'fas fa-wave-square' },
        { name: 'Breakout', icon: 'fas fa-arrow-up-from-bracket' },
        { name: 'Momentum', icon: 'fas fa-rocket' }
    ];
    
    const results = [];
    for (let i = 0; i < 5; i++) {
        const scanner = scanners[Math.floor(Math.random() * scanners.length)];
        const signal = signals[Math.floor(Math.random() * signals.length)];
        const confidence = Math.floor(Math.random() * 30) + 65;
        
        results.push({
            scanner:
