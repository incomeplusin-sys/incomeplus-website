// js/dashboard.js - Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Load recent results
    loadRecentResults();
    
    // Run quick scan button
    const quickScanBtn = document.querySelector('.btn-run-scan');
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', function() {
            window.location.href = 'scanners.html';
        });
    }
    
    // Logout functionality
    document.getElementById('logout')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = 'index.html';
        }
    });
});

function updateDashboardStats() {
    const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    const today = new Date().toDateString();
    
    // Calculate scans today
    const scansToday = savedResults.filter(result => {
        return new Date(result.savedAt).toDateString() === today;
    }).length;
    
    // Update UI elements
    document.getElementById('scansToday').textContent = scansToday;
    document.getElementById('activeAlerts').textContent = '0';
    document.getElementById('accuracyRate').textContent = '78%';
    document.getElementById('trialDays').textContent = '7';
    
    // Update greeting
    const hour = new Date().getHours();
    let greeting = 'Good ';
    if (hour < 12) greeting += 'Morning';
    else if (hour < 17) greeting += 'Afternoon';
    else greeting += 'Evening';
    
    document.getElementById('greetingName').textContent = greeting;
}

function loadRecentResults() {
    const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    const recentResultsBody = document.getElementById('recentResultsBody');
    
    if (!recentResultsBody) return;
    
    // Get last 5 results
    const recentResults = savedResults.slice(-5).reverse();
    
    if (recentResults.length === 0) {
        recentResultsBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-results">
                    <i class="fas fa-inbox"></i>
                    <p>No recent scans found</p>
                    <button class="btn-run-first-scan" onclick="window.location.href='scanners.html'">Run Your First Scan</button>
                </td>
            </tr>
        `;
        return;
    }
    
    recentResultsBody.innerHTML = recentResults.map(result => `
        <tr>
            <td>${result.scannerType || 'Breakout Scanner'}</td>
            <td>${result.stock || 'RELIANCE'}</td>
            <td><span class="signal-badge ${result.signal?.toLowerCase().includes('bullish') ? 'bullish' : 'bearish'}">${result.signal || 'Bullish Breakout'}</span></td>
            <td>${result.confidence || '85'}%</td>
            <td>${new Date(result.savedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        </tr>
    `).join('');
}
