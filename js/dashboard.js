// dashboard.js - Volume Pattern Scanner Dashboard
class Dashboard {
    constructor() {
        console.log('Dashboard initialized');
        this.init();
    }
    
    init() {
        this.loadDashboardData();
        this.setupQuickActions();
        this.setupCharts();
        this.setupRealTimeUpdates();
        this.setupEventListeners();
        this.setupNotifications();
    }
    
    async loadDashboardData() {
        const loader = app.showLoading();
        
        try {
            // Load multiple data sources in parallel (simulated)
            const stats = {
                todayScans: 12,
                activeAlerts: 3,
                accuracyRate: 82,
                trialDays: '∞',
                scansUsed: 120,
                totalScans: 1000
            };
            
            const recentScans = {
                results: [
                    {
                        scanner_type: 'volume_price',
                        stock_symbol: 'RELIANCE',
                        signal_type: 'Bullish',
                        confidence: 92,
                        scan_time: new Date().toISOString()
                    },
                    {
                        scanner_type: 'breakout',
                        stock_symbol: 'TCS',
                        signal_type: 'Bullish',
                        confidence: 88,
                        scan_time: new Date().toISOString()
                    },
                    {
                        scanner_type: 'momentum',
                        stock_symbol: 'HDFCBANK',
                        signal_type: 'Bearish',
                        confidence: 76,
                        scan_time: new Date().toISOString()
                    },
                    {
                        scanner_type: 'support_resistance',
                        stock_symbol: 'INFY',
                        signal_type: 'Neutral',
                        confidence: 65,
                        scan_time: new Date().toISOString()
                    },
                    {
                        scanner_type: 'volume_price',
                        stock_symbol: 'ICICIBANK',
                        signal_type: 'Bullish',
                        confidence: 84,
                        scan_time: new Date().toISOString()
                    }
                ]
            };
            
            const alerts = {
                alerts: [
                    {
                        id: 1,
                        title: 'Volume Spike Alert',
                        message: 'RELIANCE volume increased by 250%',
                        priority: 'medium',
                        type: 'volume',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 2,
                        title: 'Breakout Alert',
                        message: 'TCS broke resistance at ₹4,200',
                        priority: 'high',
                        type: 'price',
                        created_at: new Date().toISOString()
                    }
                ]
            };
            
            // Update dashboard with data
            this.updateStats(stats);
            this.updateRecentResults(recentScans.results);
            this.updateAlerts(alerts.alerts);
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            app.showToast('Failed to load dashboard data', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    updateStats(stats) {
        // Update quick stats cards
        document.getElementById('scansToday').textContent = stats.todayScans || 0;
        document.getElementById('activeAlerts').textContent = stats.activeAlerts || 0;
        document.getElementById('accuracyRate').textContent = `${stats.accuracyRate || 0}%`;
        
        // Update trial days if applicable
        const trialDaysElement = document.getElementById('trialDays');
        if (trialDaysElement) {
            const userPlan = document.getElementById('currentPlan')?.textContent.toLowerCase();
            if (userPlan === 'trial' && stats.trialDays) {
                trialDaysElement.textContent = stats.trialDays;
            }
        }
        
        // Update scans used progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill && stats.scansUsed && stats.totalScans) {
            const percentage = (stats.scansUsed / stats.totalScans) * 100;
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
        }
    }
    
    updateRecentResults(results) {
        const tbody = document.getElementById('recentResultsBody');
        
        if (!results || results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-results">
                        <i class="fas fa-inbox"></i>
                        <p>No recent scans found</p>
                        <button class="btn-run-first-scan" onclick="window.location.href='scanner.html'">
                            Run Your First Scan
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        results.forEach((scan, index) => {
            const confidenceClass = scan.confidence >= 80 ? 'high' : 
                                   scan.confidence >= 60 ? 'medium' : 'low';
            
            html += `
                <tr>
                    <td>
                        <div class="scanner-type">
                            <i class="fas fa-${this.getScannerIcon(scan.scanner_type)}"></i>
                            ${this.formatScannerName(scan.scanner_type)}
                        </div>
                    </td>
                    <td><strong>${scan.stock_symbol}</strong></td>
                    <td>
                        <span class="signal-badge ${scan.signal_type?.toLowerCase() || 'neutral'}">
                            ${scan.signal_type || 'Neutral'}
                        </span>
                    </td>
                    <td>
                        <div class="confidence-indicator ${confidenceClass}">
                            ${scan.confidence || 0}%
                        </div>
                    </td>
                    <td>${this.formatTime(scan.scan_time)}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    updateAlerts(alerts) {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;
        
        if (!alerts || alerts.length === 0) {
            alertsContainer.innerHTML = '<div class="no-alerts">No active alerts</div>';
            return;
        }
        
        let html = '';
        
        alerts.forEach(alert => {
            html += `
                <div class="alert-item ${alert.priority}">
                    <div class="alert-icon">
                        <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${this.formatTime(alert.created_at)}</div>
                    </div>
                    <button class="alert-dismiss" data-id="${alert.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        
        alertsContainer.innerHTML = html;
        
        // Setup dismiss buttons
        const dismissButtons = document.querySelectorAll('.alert-dismiss');
        dismissButtons.forEach(button => {
            button.addEventListener('click', () => this.dismissAlert(button.dataset.id));
        });
    }
    
    setupQuickActions() {
        const quickActions = document.querySelectorAll('.action-card');
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                e.preventDefault();
                const actionType = action.querySelector('h3').textContent;
                this.handleQuickAction(actionType);
            });
        });
        
        // Run quick scan button
        const runQuickScanBtn = document.querySelector('.btn-run-scan');
        if (runQuickScanBtn) {
            runQuickScanBtn.addEventListener('click', () => this.runQuickScan());
        }
    }
    
    handleQuickAction(action) {
        switch (action) {
            case 'Volume-Price Scan':
                window.location.href = 'scanner.html?preset=volume_price';
                break;
            case 'Breakout Scan':
                window.location.href = 'scanner.html?preset=breakout';
                break;
            case 'Watchlist':
                window.location.href = 'watchlist.html';
                break;
            case 'Alerts':
                window.location.href = 'alerts.html';
                break;
            default:
                app.showToast(`${action} clicked`, 'info');
        }
    }
    
    async runQuickScan() {
        const loader = app.showLoading('Running quick scan...');
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const newResult = {
                scanner_type: 'volume_price',
                stock_symbol: 'SBIN',
                signal_type: 'Bullish',
                confidence: 87,
                scan_time: new Date().toISOString()
            };
            
            // Add to recent results
            const tbody = document.getElementById('recentResultsBody');
            const newRow = `
                <tr>
                    <td>
                        <div class="scanner-type">
                            <i class="fas fa-chart-bar"></i>
                            Volume-Price
                        </div>
                    </td>
                    <td><strong>SBIN</strong></td>
                    <td>
                        <span class="signal-badge bullish">Bullish</span>
                    </td>
                    <td>
                        <div class="confidence-indicator high">87%</div>
                    </td>
                    <td>Just now</td>
                </tr>
            `;
            
            // Add to top of table
            tbody.innerHTML = newRow + tbody.innerHTML;
            
            // Update scans counter
            const scansElement = document.getElementById('scansToday');
            scansElement.textContent = parseInt(scansElement.textContent) + 1;
            
            app.showToast('Quick scan completed! Found bullish signal in SBIN', 'success');
            
        } catch (error) {
            console.error('Quick scan error:', error);
            app.showToast('Scan failed. Please try again.', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    setupCharts() {
        // Daily scans chart
        this.setupDailyScansChart();
        
        // Accuracy trend chart
        this.setupAccuracyTrendChart();
    }
    
    setupDailyScansChart() {
        const ctx = document.getElementById('dailyScansChart');
        if (!ctx) return;
        
        // Mock data - in production, fetch from API
        const data = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Scans',
                data: [65, 59, 80, 81, 56, 55, 40],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 20
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    setupAccuracyTrendChart() {
        const ctx = document.getElementById('accuracyTrendChart');
        if (!ctx) return;
        
        const data = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Accuracy %',
                data: [72, 78, 75, 82],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.2)',
                    'rgba(16, 185, 129, 0.3)',
                    'rgba(16, 185, 129, 0.4)',
                    'rgba(16, 185, 129, 0.5)'
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(16, 185, 129)',
                    'rgb(16, 185, 129)',
                    'rgb(16, 185, 129)'
                ],
                borderWidth: 2
            }]
        };
        
        new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => {
            // Update random stats for demo
            const activeAlertsElement = document.getElementById('activeAlerts');
            const currentAlerts = parseInt(activeAlertsElement.textContent) || 0;
            const randomChange = Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0;
            const newAlerts = Math.max(1, currentAlerts + randomChange);
            activeAlertsElement.textContent = newAlerts;
            
            // Update accuracy rate
            const accuracyRateElement = document.getElementById('accuracyRate');
            const currentAccuracy = parseInt(accuracyRateElement.textContent) || 82;
            const accuracyChange = Math.random() > 0.5 ? 1 : -1;
            const newAccuracy = Math.min(95, Math.max(75, currentAccuracy + accuracyChange));
            accuracyRateElement.textContent = newAccuracy + '%';
            
        }, 30000); // Update every 30 seconds
    }
    
    setupEventListeners() {
        // Setup notification bell
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => this.toggleNotifications());
        }
        
        // Setup all quick action buttons
        const actionButtons = document.querySelectorAll('[data-action]');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                this.handleButtonAction(action);
            });
        });
        
        // Logout button
        const logoutBtn = document.getElementById('logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    app.showToast('Logging out...', 'info');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                }
            });
        }
    }
    
    setupNotifications() {
        const notificationBell = document.getElementById('notificationBell');
        const notificationsPanel = document.getElementById('notificationsPanel');
        const markAllReadBtn = document.getElementById('markAllRead');
        
        if (notificationBell && notificationsPanel) {
            notificationBell.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsPanel.classList.toggle('active');
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!notificationsPanel.contains(e.target) && 
                    !notificationBell.contains(e.target)) {
                    notificationsPanel.classList.remove('active');
                }
            });
        }
        
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                const unreadNotifications = document.querySelectorAll('.notification-item.unread');
                unreadNotifications.forEach(notification => {
                    notification.classList.remove('unread');
                });
                
                // Update badge
                const notificationBadge = document.getElementById('notificationBadge');
                if (notificationBadge) {
                    notificationBadge.style.display = 'none';
                }
                
                app.showToast('All notifications marked as read', 'success');
            });
        }
    }
    
    toggleNotifications() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
            panel.classList.toggle('active');
        }
    }
    
    async handleButtonAction(action) {
        switch (action) {
            case 'refresh':
                await this.loadDashboardData();
                app.showToast('Dashboard refreshed', 'success');
                break;
                
            case 'export_data':
                await this.exportDashboardData();
                break;
                
            case 'settings':
                window.location.href = 'profile.html';
                break;
        }
    }
    
    async exportDashboardData() {
        const confirmed = await app.confirmDialog('Export all dashboard data to CSV?');
        
        if (confirmed) {
            const loader = app.showLoading('Exporting data...');
            
            try {
                // Simulate export
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Create sample CSV data
                const csvData = `Scanner,Stock,Signal,Confidence,Time\nVolume-Price,RELIANCE,Bullish,92%,10:25 AM\nBreakout,TCS,Bullish,88%,10:15 AM\nMomentum,HDFCBANK,Bearish,76%,09:45 AM`;
                
                downloadFile(csvData, `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
                app.showToast('Data exported successfully', 'success');
                
            } catch (error) {
                console.error('Export error:', error);
                app.showToast('Export failed', 'error');
            } finally {
                app.hideLoading(loader);
            }
        }
    }
    
    async dismissAlert(alertId) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Remove alert from UI
            const alertItems = document.querySelectorAll('.alert-item');
            alertItems.forEach(item => {
                const dismissBtn = item.querySelector('.alert-dismiss');
                if (dismissBtn && dismissBtn.dataset.id === alertId) {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(20px)';
                    setTimeout(() => {
                        item.remove();
                    }, 300);
                }
            });
            
            // Update counter
            const activeAlertsElement = document.getElementById('activeAlerts');
            const currentAlerts = parseInt(activeAlertsElement.textContent) || 0;
            activeAlertsElement.textContent = Math.max(0, currentAlerts - 1);
            
            app.showToast('Alert dismissed', 'success');
            
        } catch (error) {
            console.error('Dismiss alert error:', error);
            app.showToast('Failed to dismiss alert', 'error');
        }
    }
    
    // Helper methods
    getScannerIcon(scannerType) {
        const icons = {
            'volume_price': 'chart-bar',
            'breakout': 'chart-line',
            'momentum': 'fire',
            'support_resistance': 'layer-group',
            'moving_average': 'wave-square',
            'rsi_divergence': 'percentage',
            'volume_spike': 'bolt',
            'pattern_recognition': 'shapes',
            'gap': 'arrows-alt-v',
            'option_chain': 'link'
        };
        return icons[scannerType] || 'search';
    }
    
    formatScannerName(scannerType) {
        return scannerType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    getAlertIcon(alertType) {
        const icons = {
            'price': 'dollar-sign',
            'volume': 'chart-bar',
            'pattern': 'wave-square',
            'system': 'cog',
            'warning': 'exclamation-triangle'
        };
        return icons[alertType] || 'bell';
    }
    
    formatTime(timestamp) {
        if (!timestamp) return '--';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric'
            });
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-container')) {
        window.dashboard = new Dashboard();
    }
});
