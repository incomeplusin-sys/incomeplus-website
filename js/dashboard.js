// js/dashboard.js - REAL DASHBOARD FUNCTIONALITY
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Initialize dashboard
    initDashboard();
});

function initDashboard() {
    updateDashboardStats();
    loadRecentResults();
    setupDashboardEventListeners();
    initScannerCards();
}

function updateDashboardStats() {
    // Get data from localStorage or use defaults
    const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    const today = new Date().toDateString();
    
    const scansToday = savedResults.filter(result => {
        return new Date(result.savedAt || Date.now()).toDateString() === today;
    }).length;
    
    // Update UI elements
    document.getElementById('scansToday').textContent = scansToday;
    document.getElementById('activeAlerts').textContent = localStorage.getItem('activeAlerts') || '0';
    document.getElementById('accuracyRate').textContent = localStorage.getItem('accuracyRate') || '78%';
    document.getElementById('trialDays').textContent = localStorage.getItem('trialDays') || '7';
    
    // Update greeting
    const hour = new Date().getHours();
    let greeting = 'Good ';
    if (hour < 12) greeting += 'Morning';
    else if (hour < 17) greeting += 'Afternoon';
    else greeting += 'Evening';
    
    document.getElementById('greetingName').textContent = greeting;
    
    // Update user info
    const userName = localStorage.getItem('userName') || 'Trader';
    document.getElementById('userName').textContent = userName;
    document.getElementById('sidebarUserName').textContent = userName.split(' ')[0];
}

function loadRecentResults() {
    const recentResultsBody = document.getElementById('recentResultsBody');
    if (!recentResultsBody) return;
    
    const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    const recentResults = savedResults.slice(-5).reverse();
    
    if (recentResults.length === 0) {
        recentResultsBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-results">
                    <i class="fas fa-inbox"></i>
                    <p>No recent scans found</p>
                    <button class="btn-run-first-scan" id="runFirstScan">Run Your First Scan</button>
                </td>
            </tr>
        `;
        
        setTimeout(() => {
            document.getElementById('runFirstScan')?.addEventListener('click', function() {
                window.location.href = 'scanners.html';
            });
        }, 100);
        return;
    }
    
    recentResultsBody.innerHTML = recentResults.map(result => `
        <tr>
            <td>${result.scannerType || 'Breakout Scanner'}</td>
            <td><strong>${result.stock || 'RELIANCE'}</strong></td>
            <td><span class="signal-badge ${(result.signal || '').toLowerCase().includes('bullish') ? 'bullish' : 'bearish'}">
                ${result.signal || 'Bullish Breakout'}
            </span></td>
            <td><span class="confidence-value">${result.confidence || '85'}%</span></td>
            <td>${new Date(result.savedAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        </tr>
    `).join('');
}

function initScannerCards() {
    document.querySelectorAll('.scanner-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href) window.location.href = href;
        });
    });
}

function setupDashboardEventListeners() {
    // Quick scan button
    document.querySelector('.btn-run-scan')?.addEventListener('click', function() {
        window.location.href = 'scanners.html';
    });
    
    // Logout button
    document.getElementById('logout')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userName');
            window.location.href = 'index.html';
        }
    });
    
    // Run first scan button
    document.querySelector('.btn-run-first-scan')?.addEventListener('click', function() {
        window.location.href = 'scanners.html';
    });
}

// Add sample data for demo
function initializeSampleData() {
    if (!localStorage.getItem('savedResults')) {
        const sampleResults = [
            {
                scannerType: 'Breakout Scanner',
                stock: 'RELIANCE',
                signal: 'Bullish Breakout',
                confidence: 85,
                savedAt: new Date().toISOString()
            },
            {
                scannerType: 'Volume-Price Scanner',
                stock: 'TCS',
                signal: 'Volume Surge',
                confidence: 78,
                savedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                scannerType: 'Momentum Scanner',
                stock: 'INFY',
                signal: 'Strong Momentum',
                confidence: 82,
                savedAt: new Date(Date.now() - 7200000).toISOString()
            }
        ];
        localStorage.setItem('savedResults', JSON.stringify(sampleResults));
    }
}

// Initialize sample data
initializeSampleData();
