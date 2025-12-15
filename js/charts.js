// Chart Visualizations

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.init();
    }
    
    init() {
        this.initializeAllCharts();
        this.setupChartResize();
        this.setupExportButtons();
    }
    
    initializeAllCharts() {
        // Initialize all charts on the page
        this.initializePerformanceChart();
        this.initializeAccuracyChart();
        this.initializeVolumeChart();
        this.initializePatternDistributionChart();
    }
    
    initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;
        
        const data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'V Patterns',
                data: [65, 59, 80, 81, 56, 55],
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'U Patterns',
                data: [28, 48, 40, 19, 86, 27],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: data,
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
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Patterns Found'
                        }
                    }
                }
            }
        });
        
        this.charts.set('performance', chart);
    }
    
    initializeAccuracyChart() {
        const ctx = document.getElementById('accuracyChart');
        if (!ctx) return;
        
        const data = {
            labels: ['Volume-Price', 'Breakout', 'Momentum', 'Support-Resistance', 'Moving Average'],
            datasets: [{
                label: 'Accuracy %',
                data: [85, 78, 82, 75, 88],
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(192, 132, 252, 0.8)',
                    'rgba(79, 70, 229, 0.6)'
                ],
                borderColor: [
                    'rgb(79, 70, 229)',
                    'rgb(139, 92, 246)',
                    'rgb(168, 85, 247)',
                    'rgb(192, 132, 252)',
                    'rgb(79, 70, 229)'
                ],
                borderWidth: 1
            }]
        };
        
        const chart = new Chart(ctx, {
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
                        title: {
                            display: true,
                            text: 'Accuracy %'
                        }
                    }
                }
            }
        });
        
        this.charts.set('accuracy', chart);
    }
    
    initializeVolumeChart() {
        const ctx = document.getElementById('volumeChart');
        if (!ctx) return;
        
        const data = {
            labels: Array.from({length: 20}, (_, i) => `C${i + 1}`),
            datasets: [{
                label: 'Volume',
                data: Array.from({length: 20}, () => Math.floor(Math.random() * 1000000) + 500000),
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    
                    if (!chartArea) return null;
                    
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');
                    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.6)');
                    
                    return gradient;
                },
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
        const chart = new Chart(ctx, {
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
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Volume'
                        },
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return (value / 1000).toFixed(0) + 'K';
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });
        
        this.charts.set('volume', chart);
    }
    
    initializePatternDistributionChart() {
        const ctx = document.getElementById('patternDistributionChart');
        if (!ctx) return;
        
        const data = {
            labels: ['V Patterns', 'U Patterns', 'No Patterns'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(203, 213, 224, 0.8)'
                ],
                borderColor: [
                    'rgb(79, 70, 229)',
                    'rgb(16, 185, 129)',
                    'rgb(203, 213, 224)'
                ],
                borderWidth: 1
            }]
        };
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        this.charts.set('distribution', chart);
    }
    
    setupChartResize() {
        // Handle chart resize on window resize
        const resizeHandler = debounce(() => {
            this.charts.forEach(chart => {
                chart.resize();
            });
        }, 250);
        
        window.addEventListener('resize', resizeHandler);
    }
    
    setupExportButtons() {
        // Setup chart export buttons
        const exportButtons = document.querySelectorAll('[data-chart-export]');
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                const chartId = button.dataset.chartExport;
                this.exportChart(chartId);
            });
        });
    }
    
    exportChart(chartId) {
        const chart = this.charts.get(chartId);
        if (!chart) {
            app.showToast('Chart not found', 'error');
            return;
        }
        
        const canvas = chart.canvas;
        const link = document.createElement('a');
        link.download = `${chartId}_chart_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        app.showToast('Chart exported as PNG', 'success');
    }
    
    async updateChartData(chartId, data) {
        const chart = this.charts.get(chartId);
        if (!chart) return;
        
        chart.data = data;
        chart.update();
    }
    
    async loadRealChartData(chartId, endpoint) {
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.success) {
                this.updateChartData(chartId, data.chartData);
            }
        } catch (error) {
            console.error(`Failed to load chart data for ${chartId}:`, error);
        }
    }
    
    // Utility function to create gradient
    createGradient(ctx, chartArea, colorStops) {
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        
        return gradient;
    }
    
    // Create volume pattern visualization
    createVolumePatternChart(canvasId, patternData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        const data = {
            labels: patternData.labels,
            datasets: [{
                label: 'Volume',
                data: patternData.volumes,
                backgroundColor: 'rgba(79, 70, 229, 0.3)',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }, {
                label: 'Price',
                data: patternData.prices,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: 'y1'
            }]
        };
        
        return new Chart(ctx, {
            type: 'line',
            data: data,
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
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Volume'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Price'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
    
    // Create scanner comparison chart
    createScannerComparisonChart(canvasId, comparisonData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        const data = {
            labels: comparisonData.labels,
            datasets: [
                {
                    label: 'Accuracy',
                    data: comparisonData.accuracy,
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Signals Found',
                    type: 'bar',
                    data: comparisonData.signals,
                    backgroundColor: 'rgba(16, 185, 129, 0.3)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1,
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        };
        
        return new Chart(ctx, {
            type: 'line',
            data: data,
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
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Accuracy %'
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Signals Found'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize chart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chartManager = new ChartManager();
});
