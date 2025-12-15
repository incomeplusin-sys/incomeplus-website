// Dashboard Functionality

class Dashboard {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadDashboardData();
        this.setupQuickActions();
        this.setupCharts();
        this.setupRealTimeUpdates();
        this.setupEventListeners();
    }
    
    async loadDashboardData() {
        const loader = app.showLoading();
        
        try {
            // Load multiple data sources in parallel
            const [statsResponse, recentScansResponse, alertsResponse] = await Promise.all([
                fetch('/php/scanner.php?action=dashboard_stats'),
                fetch('/php/scanner.php?action=get_recent_results&limit=5'),
                fetch('/php/alerts.php?action=get_active_alerts')
            ]);
            
            const stats = await statsResponse.json();
            const recentScans = await recentScansResponse.json();
            const alerts = await alertsResponse.json();
            
            // Update dashboard with data
            if (stats.success) this.updateStats(stats.stats);
            if (recentScans.success) this.updateRecentResults(recentScans.results);
            if (alerts.success) this.updateAlerts(alerts.alerts);
            
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
        const loader = app.showLoading();
        
        try {
            const response = await fetch('/php/scanner.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'run_quick_scan',
                    scanner_type: 'volume_price',
                    parameters: {
                        pattern_type: 'both',
                        timeframe: '5m',
                        min_confidence: 70,
                        limit: 10
                    }
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                app.showToast(`Found ${data.results.length} patterns`, 'success');
                
                // Update recent results
                if (data.results.length > 0) {
                    this.updateRecentResults(data.results.slice(0, 5));
                }
                
                // Refresh stats
                this.loadDashboardData();
                
            } else {
                app.showToast(data.message || 'Scan failed', 'error');
            }
            
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
        
        // Scanner performance chart
        this.setupScannerPerformanceChart();
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
    
    setupScannerPerformanceChart() {
        const ctx = document.getElementById('scannerPerformanceChart');
        if (!ctx) return;
        
        // This would be implemented in a separate page
    }
    
    setupRealTimeUpdates() {
        // Setup WebSocket for real-time updates (if needed)
        this.setupWebSocket();
        
        // Poll for updates every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }
    
    setupWebSocket() {
        // WebSocket implementation for real-time notifications
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('WebSocket disconnected');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.setupWebSocket(), 5000);
            };
            
        } catch (error) {
            console.error('WebSocket error:', error);
        }
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_scan_result':
                app.showToast(`New pattern found in ${data.symbol}`, 'info');
                this.updateRecentResults([data.result]);
                break;
                
            case 'new_alert':
                app.showToast(`New alert: ${data.title}`, 'warning');
                this.updateAlerts([data.alert]);
                break;
                
            case 'scan_completed':
                app.showToast(`Scan completed: ${data.count} patterns found`, 'success');
                break;
        }
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
            const loader = app.showLoading();
            
            try {
                const response = await fetch('/php/export.php?type=dashboard');
                const data = await response.json();
                
                if (data.success) {
                    downloadFile(data.csv, `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
                    app.showToast('Data exported successfully', 'success');
                }
                
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
            const response = await fetch('/php/alerts.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'dismiss_alert',
                    alert_id: alertId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Remove alert from UI
                const alertItem = document.querySelector(`[data-id="${alertId}"]`);
                if (alertItem) {
                    alertItem.closest('.alert-item').remove();
                }
                
                app.showToast('Alert dismissed', 'success');
            }
            
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
