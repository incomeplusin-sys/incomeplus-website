// Core Scanner Engine
class ScannerCore {
    constructor() {
        this.currentScanner = null;
        this.scanResults = [];
        this.isScanning = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserPresets();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Run Scan button
        const runScanBtn = document.getElementById('runScan');
        if (runScanBtn) {
            runScanBtn.addEventListener('click', () => this.runScan());
        }
        
        // Export Results button
        const exportBtn = document.getElementById('exportResults');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportResults());
        }
        
        // Save Results button
        const saveBtn = document.getElementById('saveResults');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveResults());
        }
        
        // Range sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const valueSpan = document.getElementById(slider.id + 'Value');
            if (valueSpan) {
                slider.addEventListener('input', () => {
                    valueSpan.textContent = slider.value + (slider.id.includes('Threshold') ? '%' : 
                                                           slider.id.includes('Multiplier') ? 'x' : '');
                });
            }
        });
    }
    
    async runScan() {
        if (this.isScanning) {
            this.showNotification('Scan already in progress', 'warning');
            return;
        }
        
        this.isScanning = true;
        
        // Update UI
        const runBtn = document.getElementById('runScan');
        const originalText = runBtn.innerHTML;
        runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
        runBtn.disabled = true;
        
        try {
            // Get scanner parameters
            const params = this.getScannerParameters();
            
            // Show loading in results table
            this.showLoadingResults();
            
            // Simulate API call (replace with actual API call)
            await this.simulateScan(params);
            
            // Update results count and time
            this.updateResultsInfo();
            
            this.showNotification('Scan completed successfully!', 'success');
            
        } catch (error) {
            console.error('Scan error:', error);
            this.showNotification('Scan failed: ' + error.message, 'error');
        } finally {
            this.isScanning = false;
            runBtn.innerHTML = originalText;
            runBtn.disabled = false;
        }
    }
    
    getScannerParameters() {
        const params = {};
        
        // Get all parameter inputs
        const selects = document.querySelectorAll('.param-select');
        const ranges = document.querySelectorAll('input[type="range"]');
        const numbers = document.querySelectorAll('input[type="number"]');
        
        selects.forEach(select => {
            if (select.multiple) {
                params[select.id] = Array.from(select.selectedOptions).map(opt => opt.value);
            } else {
                params[select.id] = select.value;
            }
        });
        
        ranges.forEach(range => {
            params[range.id] = range.value;
        });
        
        numbers.forEach(number => {
            params[number.id] = number.value;
        });
        
        // Add scanner type
        const scannerTitle = document.querySelector('.scanner-title h1');
        if (scannerTitle) {
            params.scannerType = scannerTitle.textContent.replace(' Scanner', '').trim();
        }
        
        return params;
    }
    
    async simulateScan(params) {
        // Simulate scan delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate sample data based on scanner type
        this.scanResults = this.generateSampleResults(params);
        
        // Update results table
        this.updateResultsTable();
    }
    
    generateSampleResults(params) {
        const results = [];
        const scannerType = params.scannerType || 'Volume-Price';
        
        // Sample stocks
        const stocks = [
            { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2456.75, change: 1.25 },
            { symbol: 'TCS', name: 'Tata Consultancy', price: 3678.90, change: 0.85 },
            { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1678.45, change: -0.32 },
            { symbol: 'INFY', name: 'Infosys', price: 1567.80, change: 2.15 },
            { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 987.65, change: 1.75 },
            { symbol: 'ITC', name: 'ITC Limited', price: 456.78, change: 0.45 },
            { symbol: 'SBIN', name: 'State Bank of India', price: 678.90, change: 1.88 },
            { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1123.45, change: -0.65 },
            { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1789.00, change: 1.22 },
            { symbol: 'AXISBANK', name: 'Axis Bank', price: 1023.45, change: 2.05 }
        ];
        
        // Generate 3-8 random signals
        const numResults = Math.floor(Math.random() * 6) + 3;
        const selectedStocks = [...stocks].sort(() => Math.random() - 0.5).slice(0, numResults);
        
        selectedStocks.forEach((stock, index) => {
            let signal, confidence, volumeChange, priceChange;
            
            switch(scannerType) {
                case 'Breakout':
                    signal = Math.random() > 0.5 ? 'Bullish Breakout' : 'Bearish Breakout';
                    confidence = Math.floor(Math.random() * 20) + 75; // 75-95%
                    volumeChange = Math.floor(Math.random() * 150) + 50; // 50-200%
                    priceChange = (Math.random() * 4) + 1; // 1-5%
                    break;
                    
                case 'Volume-Price':
                    signal = Math.random() > 0.5 ? 'Volume Divergence' : 'Price Confirmation';
                    confidence = Math.floor(Math.random() * 25) + 70; // 70-95%
                    volumeChange = Math.floor(Math.random() * 200) + 30; // 30-230%
                    priceChange = (Math.random() * 3) + 0.5; // 0.5-3.5%
                    break;
                    
                case 'Momentum':
                    signal = Math.random() > 0.5 ? 'Strong Momentum' : 'Momentum Reversal';
                    confidence = Math.floor(Math.random() * 30) + 65; // 65-95%
                    volumeChange = Math.floor(Math.random() * 100) + 20; // 20-120%
                    priceChange = (Math.random() * 5) + 1; // 1-6%
                    break;
                    
                default:
                    signal = 'Signal Detected';
                    confidence = 80;
                    volumeChange = 100;
                    priceChange = 2.5;
            }
            
            results.push({
                symbol: stock.symbol,
                name: stock.name,
                signal: signal,
                confidence: confidence,
                volumeChange: volumeChange,
                priceChange: priceChange,
                currentPrice: stock.price,
                priceDirection: stock.change >= 0 ? 'up' : 'down',
                timeframe: params.timeframe || '1 Hour',
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
        });
        
        return results;
    }
    
    updateResultsTable() {
        const tbody = document.getElementById('resultsBody');
        if (!tbody) return;
        
        if (this.scanResults.length === 0) {
            tbody.innerHTML = `
                <tr class="no-results">
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 10px; display: block;"></i>
                        <p>No signals found with current parameters.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.scanResults.map(result => `
            <tr>
                <td>
                    <div class="stock-info">
                        <strong>${result.symbol}</strong>
                        <small>${result.name}</small>
                    </div>
                </td>
                <td>
                    <span class="signal-badge ${result.signal.includes('Bullish') ? 'bullish' : 'bearish'}">
                        ${result.signal}
                    </span>
                </td>
                <td>${result.volumeChange}%</td>
                <td>
                    <span class="price ${result.priceDirection}">
                        ₹${result.currentPrice.toFixed(2)}
                        <small>(${result.priceChange.toFixed(2)}%)</small>
                    </span>
                </td>
                <td>${result.confidence}%</td>
                <td>${result.timeframe}</td>
                <td>
                    <button class="btn-history" onclick="viewStockHistory('${result.symbol}')">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
                <td>
                    <button class="btn-alert" onclick="setAlert('${result.symbol}')">
                        <i class="fas fa-bell"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    showLoadingResults() {
        const tbody = document.getElementById('resultsBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4f46e5;"></i>
                        <p style="margin-top: 10px;">Scanning market data...</p>
                    </td>
                </tr>
            `;
        }
    }
    
    updateResultsInfo() {
        const countSpan = document.getElementById('resultsCount');
        const timeSpan = document.getElementById('scanTime');
        
        if (countSpan) {
            countSpan.textContent = `${this.scanResults.length} signals found`;
        }
        
        if (timeSpan) {
            const now = new Date();
            timeSpan.textContent = `Last scan: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        }
    }
    
    exportResults() {
        if (this.scanResults.length === 0) {
            this.showNotification('No results to export', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = ['Symbol', 'Name', 'Signal', 'Confidence', 'Volume Change', 'Price Change', 'Current Price', 'Timeframe'];
        const csvRows = [
            headers.join(','),
            ...this.scanResults.map(r => [
                r.symbol,
                `"${r.name}"`,
                r.signal,
                r.confidence + '%',
                r.volumeChange + '%',
                r.priceChange.toFixed(2) + '%',
                '₹' + r.currentPrice.toFixed(2),
                r.timeframe
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scanner-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        this.showNotification('Results exported successfully', 'success');
    }
    
    async saveResults() {
        if (this.scanResults.length === 0) {
            this.showNotification('No results to save', 'warning');
            return;
        }
        
        try {
            // Get current user
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!user.id) {
                this.showNotification('Please login to save results', 'warning');
                return;
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Save to localStorage for demo
            const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
            const scannerType = document.querySelector('.scanner-title h1').textContent.replace(' Scanner', '').trim();
            
            const resultsToSave = this.scanResults.map(result => ({
                ...result,
                userId: user.id,
                scannerType: scannerType,
                savedAt: new Date().toISOString()
            }));
            
            savedResults.push(...resultsToSave);
            localStorage.setItem('savedResults', JSON.stringify(savedResults));
            
            this.showNotification('Results saved to database', 'success');
            
        } catch (error) {
            console.error('Save error:', error);
            this.showNotification('Failed to save results', 'error');
        }
    }
    
    loadUserPresets() {
        // Load user's saved presets
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
            const presets = JSON.parse(localStorage.getItem(`presets_${user.id}`) || '[]');
            // Apply presets if any
        }
    }
    
    showNotification(message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    updateUI() {
        // Update any dynamic UI elements
    }
}

// Global functions
function viewStockHistory(symbol) {
    alert(`Viewing history for ${symbol}`);
    // In real app, this would show detailed chart/history
}

function setAlert(symbol) {
    alert(`Setting alert for ${symbol}`);
    // In real app, this would open alert configuration modal
}

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.scannerCore = new ScannerCore();
});
