// Chart Management for IncomePlus Scanner
// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 992) {
            if (sidebar && sidebar.classList.contains('active') && 
                !sidebar.contains(event.target) && 
                !mobileMenuBtn.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
    
    // User data (simulated)
    const userData = {
        name: "John Trader",
        plan: "Trial",
        planExpiry: "Expires in 7 days",
        scansToday: 0,
        activeAlerts: 0,
        accuracyRate: "0%",
        trialDays: 7
    };
    
    // Update user info
    function updateUserInfo() {
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('sidebarUserName').textContent = userData.name.split(' ')[0]; // First name only
        document.getElementById('currentPlan').textContent = userData.plan;
        document.getElementById('planExpiry').textContent = userData.planExpiry;
        document.getElementById('greetingName').textContent = userData.name.split(' ')[0];
        document.getElementById('scansToday').textContent = userData.scansToday;
        document.getElementById('activeAlerts').textContent = userData.activeAlerts;
        document.getElementById('accuracyRate').textContent = userData.accuracyRate;
        document.getElementById('trialDays').textContent = userData.trialDays;
    }
    
    // Simulate recent results
    function loadRecentResults() {
        const recentResultsBody = document.getElementById('recentResultsBody');
        if (recentResultsBody && userData.scansToday === 0) {
            recentResultsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-results">
                        <i class="fas fa-inbox"></i>
                        <p>No recent scans found</p>
                        <button class="btn-run-first-scan">Run Your First Scan</button>
                    </td>
                </tr>
            `;
            
            // Add event listener to run first scan button
            const btn = document.querySelector('.btn-run-first-scan');
            if (btn) {
                btn.addEventListener('click', function() {
                    window.location.href = 'scanners/volume-price.html';
                });
            }
        }
    }
    
    // Run quick scan button
    const quickScanBtn = document.querySelector('.btn-run-scan');
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', function() {
            window.location.href = 'scanners/volume-price.html';
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                // In a real app, this would clear session/token
                localStorage.removeItem('userToken');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Initialize dashboard
    updateUserInfo();
    loadRecentResults();
    
    // Simulate data updates (for demo purposes)
    setInterval(() => {
        // Update random stats every 5 seconds
        if (Math.random() > 0.7) {
            userData.scansToday++;
            updateUserInfo();
            loadRecentResults();
        }
    }, 5000);
});
class ChartManager {
    constructor() {
        this.charts = {};
    }
    
    // Initialize all charts on page
    init() {
        this.initPerformanceChart();
        this.initDailyScansChart();
        this.initAccuracyTrendChart();
        this.initScannerPerformanceChart();
    }
    
    // Performance Chart for Results Page
    initPerformanceChart() {
        const chartCanvas = document.getElementById('performanceChart');
        if (!chartCanvas) return;
        
        // Check if it's already a canvas
        if (chartCanvas.tagName !== 'CANVAS') {
            // Create canvas if it's a div
            const ctx = document.createElement('canvas');
            chartCanvas.innerHTML = '';
            chartCanvas.appendChild(ctx);
            this.initPerformanceChart(); // Re-call with canvas
            return;
        }
        
        // Get data from localStorage
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        if (savedResults.length === 0) {
            // Show placeholder if no data
            const container = chartCanvas.parentElement;
            if (container) {
                container.innerHTML = `
                    <div class="chart-placeholder">
                        <i class="fas fa-chart-line"></i>
                        <p>No data available for chart</p>
                        <p style="font-size: 0.9rem; margin-top: 10px; color: #94a3b8;">
                            Run some scans to see performance data
                        </p>
                    </div>
                `;
            }
            return;
        }
        
        const ctx = chartCanvas.getContext('2d');
        
        // Group results by date
        const resultsByDate = {};
        savedResults.forEach(result => {
            const date = new Date(result.savedAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            });
            if (!resultsByDate[date]) {
                resultsByDate[date] = {
                    totalConfidence: 0,
                    count: 0,
                    signals: []
                };
            }
            resultsByDate[date].totalConfidence += result.confidence;
            resultsByDate[date].count++;
            resultsByDate[date].signals.push(result.signal);
        });
        
        // Get last 7 days
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            }));
        }
        
        // Calculate average confidence per day
        const avgConfidence = dates.map(date => {
            if (resultsByDate[date]) {
                return Math.round(resultsByDate[date].totalConfidence / resultsByDate[date].count);
            }
            return 0;
        });
        
        // Calculate bullish signals percentage
        const bullishPercentages = dates.map(date => {
            if (resultsByDate[date] && resultsByDate[date].signals.length > 0) {
                const signals = resultsByDate[date].signals;
                const bullishCount = signals.filter(s => s.toLowerCase().includes('bullish')).length;
                return Math.round((bullishCount / signals.length) * 100);
            }
            return 0;
        });
        
        // Destroy existing chart if it exists
        if (this.charts.performance) {
            this.charts.performance.destroy();
        }
        
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Average Confidence %',
                        data: avgConfidence,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Bullish Signals %',
                        data: bullishPercentages,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Poppins'
                            },
                            color: '#475569'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: {
                            family: 'Poppins'
                        },
                        bodyFont: {
                            family: 'Poppins'
                        },
                        padding: 12,
                        cornerRadius: 6
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)'
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Poppins'
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 100,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)'
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Poppins'
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Poppins'
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }
    
    // Daily Scans Chart for Dashboard
    initDailyScansChart() {
        const chartContainer = document.getElementById('dailyScansChart');
        if (!chartContainer) return;
        
        // Check if canvas exists, create if not
        let canvas = chartContainer.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            chartContainer.innerHTML = '';
            chartContainer.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        // Get last 7 days
        const dates = [];
        const scanCounts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('en-IN', { weekday: 'short' });
            dates.push(dateString);
            
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            
            const dayScans = savedResults.filter(result => {
                const resultDate = new Date(result.savedAt);
                return resultDate >= dayStart && resultDate <= dayEnd;
            }).length;
            
            scanCounts.push(dayScans);
        }
        
        // Destroy existing chart if it exists
        if (this.charts.dailyScans) {
            this.charts.dailyScans.destroy();
        }
        
        this.charts.dailyScans = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Scans per Day',
                    data: scanCounts,
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                    borderColor: '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: {
                            family: 'Poppins'
                        },
                        bodyFont: {
                            family: 'Poppins'
                        },
                        padding: 10,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                return `Scans: ${context.raw}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(226, 232, 240, 0.5)'
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Poppins'
                            },
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Poppins'
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Accuracy Trend Chart
    initAccuracyTrendChart() {
        const chartContainer = document.getElementById('accuracyTrendChart');
        if (!chartContainer) return;
        
        let canvas = chartContainer.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            chartContainer.innerHTML = '';
            chartContainer.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        if (savedResults.length === 0) {
            chartContainer.innerHTML = `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-pie"></i>
                    <p>No scanner data available</p>
                </div>
            `;
            return;
        }
        
        // Group by scanner type
        const scannerData = {};
        savedResults.forEach(result => {
            const scanner = result.scannerType;
            if (!scannerData[scanner]) {
                scannerData[scanner] = {
                    totalConfidence: 0,
                    count: 0
                };
            }
            scannerData[scanner].totalConfidence += result.confidence;
            scannerData[scanner].count++;
        });
        
        const scanners = Object.keys(scannerData);
        const avgConfidences = scanners.map(scanner => 
            Math.round(scannerData[scanner].totalConfidence / scannerData[scanner].count)
        );
        
        const backgroundColors = [
            'rgba(79, 70, 229, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(14, 165, 233, 0.7)'
        ];
        
        // Destroy existing chart if it exists
        if (this.charts.accuracyTrend) {
            this.charts.accuracyTrend.destroy();
        }
        
        this.charts.accuracyTrend = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: scanners,
                datasets: [{
                    data: avgConfidences,
                    backgroundColor: backgroundColors.slice(0, scanners.length),
                    borderColor: 'white',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                family: 'Poppins',
                                size: 11
                            },
                            color: '#475569',
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: {
                            family: 'Poppins'
                        },
                        bodyFont: {
                            family: 'Poppins'
                        },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value}% accuracy`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    // Scanner Performance Comparison Chart
    initScannerPerformanceChart() {
        const chartContainer = document.getElementById('scannerPerformanceChart');
        if (!chartContainer) return;
        
        let canvas = chartContainer.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        
        // This chart is optional - only initialize if needed
        this.charts.scannerPerformance = null;
    }
    
    // Update all charts with new data
    updateAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            if (this.charts[chartName]) {
                this.charts[chartName].destroy();
            }
        });
        this.charts = {};
        this.init();
    }
    
    // Destroy all charts
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            if (this.charts[chartName]) {
                this.charts[chartName].destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chartManager = new ChartManager();
    
    // Initialize charts after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (window.chartManager) {
            window.chartManager.init();
        }
    }, 1000);
    
    // Event listener for chart refresh
    const refreshChartBtn = document.getElementById('refreshChart');
    if (refreshChartBtn) {
        refreshChartBtn.addEventListener('click', function() {
            if (window.chartManager) {
                window.chartManager.updateAllCharts();
                showNotification('Charts refreshed successfully!', 'success');
            }
        });
    }
    
    // Event listener for chart download
    const downloadChartBtn = document.getElementById('downloadChart');
    if (downloadChartBtn) {
        downloadChartBtn.addEventListener('click', function() {
            const chartCanvas = document.getElementById('performanceChart');
            if (chartCanvas && chartCanvas.tagName === 'CANVAS') {
                const link = document.createElement('a');
                link.download = 'scanner-performance-' + new Date().toISOString().split('T')[0] + '.png';
                link.href = chartCanvas.toDataURL('image/png');
                link.click();
                showNotification('Chart downloaded successfully!', 'success');
            } else {
                showNotification('No chart available to download', 'warning');
            }
        });
    }
});

// Helper function for notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                             type === 'error' ? 'exclamation-circle' : 
                             type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <p>${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Close button
    notification.querySelector('.toast-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
