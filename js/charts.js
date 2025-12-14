// Chart Management for IncomePlus Scanner

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
        
        // Get data from localStorage
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        if (savedResults.length === 0) {
            // Show placeholder if no data
            chartCanvas.innerHTML = `
                <div class="chart-placeholder">
                    <i class="fas fa-chart-line"></i>
                    <p>No data available for chart</p>
                    <p style="font-size: 0.9rem; margin-top: 10px; color: #94a3b8;">
                        Run some scans to see performance data
                    </p>
                </div>
            `;
            return;
        }
        
        // Prepare chart data
        const ctx = chartCanvas.getContext('2d');
        
        // Group results by date
        const resultsByDate = {};
        savedResults.forEach(result => {
            const date = new Date(result.savedAt).toLocaleDateString();
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
        
        // Calculate average confidence per day
        const dates = Object.keys(resultsByDate).slice(-7); // Last 7 days
        const avgConfidence = dates.map(date => 
            Math.round(resultsByDate[date].totalConfidence / resultsByDate[date].count)
        );
        
        // Calculate bullish signals percentage
        const bullishPercentages = dates.map(date => {
            const signals = resultsByDate[date].signals;
            const bullishCount = signals.filter(s => s.toLowerCase().includes('bullish')).length;
            return Math.round((bullishCount / signals.length) * 100);
        });
        
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
                        borderWidth: 3,
                        fill: true,
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
                    title: {
                        display: true,
                        text: 'Scanner Performance Over Last 7 Days',
                        font: {
                            size: 14,
                            family: 'Poppins'
                        },
                        color: '#1e293b'
                    },
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
                        },
                        title: {
                            display: true,
                            text: 'Confidence %',
                            color: '#475569',
                            font: {
                                family: 'Poppins',
                                weight: '500'
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
                        },
                        title: {
                            display: true,
                            text: 'Bullish %',
                            color: '#475569',
                            font: {
                                family: 'Poppins',
                                weight: '500'
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
        
        this.charts.dailyScans = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Scans per Day',
                    data: scanCounts,
                    backgroundColor: [
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(79, 70, 229, 0.7)'
                    ],
                    borderColor: [
                        '#4f46e5',
                        '#4f46e5',
                        '#4f46e5',
                        '#4f46e5',
                        '#4f46e5',
                        '#4f46e5',
                        '#4f46e5'
                    ],
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
                        },
                        title: {
                            display: true,
                            text: 'Number of Scans',
                            color: '#475569',
                            font: {
                                family: 'Poppins',
                                weight: '500'
                            }
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
        
        this.charts.accuracyTrend = new Chart(ctx, {
            type: 'pie',
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
                                size: 12
                            },
                            color: '#475569',
                            padding: 20,
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
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value}% (${percentage}% of total)`;
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
            chartContainer.innerHTML = '';
            chartContainer.appendChild(canvas);
        }
        
        const ctx = canvas.getContext('2d');
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        // Group by scanner type
        const scannerStats = {};
        savedResults.forEach(result => {
            const scanner = result.scannerType;
            if (!scannerStats[scanner]) {
                scannerStats[scanner] = {
                    totalConfidence: 0,
                    count: 0,
                    bullish: 0,
                    bearish: 0,
                    neutral: 0
                };
            }
            scannerStats[scanner].totalConfidence += result.confidence;
            scannerStats[scanner].count++;
            
            if (result.signal.toLowerCase().includes('bullish')) {
                scannerStats[scanner].bullish++;
            } else if (result.signal.toLowerCase().includes('bearish')) {
                scannerStats[scanner].bearish++;
            } else {
                scannerStats[scanner].neutral++;
            }
        });
        
        const scanners = Object.keys(scannerStats);
        const avgConfidences = scanners.map(scanner => 
            Math.round(scannerStats[scanner].totalConfidence / scannerStats[scanner].count)
        );
        const totalScans = scanners.map(scanner => scannerStats[scanner].count);
        
        this.charts.scannerPerformance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: scanners,
                datasets: [
                    {
                        label: 'Avg Confidence %',
                        data: avgConfidences,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#4f46e5',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    },
                    {
                        label: 'Total Scans',
                        data: totalScans.map(count => count * 10), // Scale for better visualization
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                let value = context.raw;
                                
                                if (label.includes('Total Scans')) {
                                    value = value / 10; // Unscale the value
                                    return `${label}: ${Math.round(value)} scans`;
                                }
                                return `${label}: ${value}%`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(226, 232, 240, 0.5)'
                        },
                        grid: {
                            color: 'rgba(226, 232, 240, 0.3)'
                        },
                        pointLabels: {
                            font: {
                                family: 'Poppins',
                                size: 11
                            },
                            color: '#475569'
                        },
                        ticks: {
                            font: {
                                family: 'Poppins'
                            },
                            color: '#64748b',
                            backdropColor: 'transparent'
                        },
                        min: 0,
                        max: 100
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
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
    }, 500);
    
    // Update charts when new data is added
    document.addEventListener('scanCompleted', function() {
        if (window.chartManager) {
            setTimeout(() => {
                window.chartManager.updateAllCharts();
            }, 1000);
        }
    });
    
    // Update charts when filters are applied
    document.addEventListener('filtersApplied', function() {
        if (window.chartManager) {
            setTimeout(() => {
                window.chartManager.updateAllCharts();
            }, 500);
        }
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
