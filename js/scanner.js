// Volume Pattern Scanner Logic

class VolumePatternScanner {
    constructor() {
        this.isScanning = false;
        this.scanResults = [];
        this.scanStartTime = null;
        this.timerInterval = null;
        
        this.initializeEventListeners();
        this.updateUI();
    }
    
    initializeEventListeners() {
        // Run Scan Button
        document.getElementById('runScan')?.addEventListener('click', () => this.startScan());
        
        // Stop Scan Button
        document.getElementById('stopScan')?.addEventListener('click', () => this.stopScan());
        
        // Export to Excel
        document.getElementById('exportExcel')?.addEventListener('click', () => this.exportToExcel());
        
        // Clear Results
        document.getElementById('clearResults')?.addEventListener('click', () => this.clearResults());
        
        // Confidence Slider
        const confidenceSlider = document.getElementById('minConfidence');
        const confidenceValue = document.querySelector('.confidence-value');
        
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = `${e.target.value}%`;
            });
        }
        
        // Save Preset
        document.getElementById('savePreset')?.addEventListener('click', () => this.savePreset());
    }
    
    async startScan() {
        if (this.isScanning) return;
        
        // Get scanner parameters
        const params = this.getScannerParams();
        
        // Update UI to scanning state
        this.isScanning = true;
        this.scanStartTime = Date.now();
        this.updateUI();
        
        // Start timer
        this.startTimer();
        
        try {
            // Call backend scanner
            const results = await this.scanStocks(params);
            
            // Process and display results
            this.processResults(results);
            
        } catch (error) {
            console.error('Scan failed:', error);
            this.showError('Scan failed: ' + error.message);
        } finally {
            this.stopScan();
        }
    }
    
    stopScan() {
        this.isScanning = false;
        this.stopTimer();
        this.updateUI();
    }
    
    getScannerParams() {
        return {
            patternType: document.getElementById('patternType').value,
            timeFrame: document.getElementById('timeFrame').value,
            minConfidence: parseInt(document.getElementById('minConfidence').value),
            maxStocks: parseInt(document.getElementById('maxStocks').value),
            minVolume: document.getElementById('minVolume').value ? 
                parseInt(document.getElementById('minVolume').value) : null,
            minPrice: document.getElementById('minPrice').value ? 
                parseFloat(document.getElementById('minPrice').value) : null,
            maxPrice: document.getElementById('maxPrice').value ? 
                parseFloat(document.getElementById('maxPrice').value) : null,
            priceChange: document.getElementById('priceChange').value
        };
    }
    
    async scanStocks(params) {
        // Simulate API call to backend scanner
        // In production, this would call your PHP/Flask backend
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock results for demo
                const mockResults = this.generateMockResults(params);
                resolve(mockResults);
            }, 3000);
        });
    }
    
    generateMockResults(params) {
        const stocks = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
                       'KOTAKBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LT'];
        
        const results = [];
        
        stocks.forEach((stock, index) => {
            // Randomly include stocks based on pattern type
            const hasPattern = Math.random() > 0.5;
            
            if (hasPattern) {
                const pattern = params.patternType === 'both' ? 
                    (Math.random() > 0.5 ? 'V' : 'U') :
                    params.patternType.toUpperCase();
                
                const confidence = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
                
                if (confidence >= params.minConfidence) {
                    results.push({
                        id: index + 1,
                        symbol: stock,
                        pattern: pattern,
                        confidence: confidence,
                        price: (Math.random() * 5000 + 100).toFixed(2),
                        change: (Math.random() * 10 - 5).toFixed(2),
                        volume: Math.floor(Math.random() * 10000000) + 1000000,
                        time: new Date().toLocaleTimeString()
                    });
                }
            }
        });
        
        return results;
    }
    
    processResults(results) {
        this.scanResults = results;
        
        // Update statistics
        this.updateStatistics(results);
        
        // Update results table
        this.updateResultsTable(results);
        
        // Save to database
        this.saveResultsToDB(results);
    }
    
    updateStatistics(results) {
        const vPatterns = results.filter(r => r.pattern === 'V').length;
        const uPatterns = results.filter(r => r.pattern === 'U').length;
        const avgConfidence = results.length > 0 ?
            results.reduce((sum, r) => sum + r.confidence, 0) / results.length : 0;
        
        document.getElementById('patternsFound').textContent = results.length;
        document.getElementById('vPatterns').textContent = vPatterns;
        document.getElementById('uPatterns').textContent = uPatterns;
        document.getElementById('avgConfidence').textContent = 
            avgConfidence.toFixed(1) + '%';
    }
    
    updateResultsTable(results) {
        const tbody = document.getElementById('resultsBody');
        
        if (results.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No patterns found in this scan</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        results.forEach(result => {
            const changeClass = result.change >= 0 ? 'positive' : 'negative';
            
            html += `
                <tr>
                    <td>${result.id}</td>
                    <td><strong>${result.symbol}</strong></td>
                    <td>
                        <span class="pattern-badge ${result.pattern.toLowerCase()}-pattern">
                            ${result.pattern} Pattern
                        </span>
                    </td>
                    <td>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${result.confidence}%"></div>
                            <span>${result.confidence}%</span>
                        </div>
                    </td>
                    <td>₹${result.price}</td>
                    <td class="${changeClass}">${result.change >= 0 ? '+' : ''}${result.change}%</td>
                    <td>${this.formatVolume(result.volume)}</td>
                    <td>${result.time}</td>
                    <td>
                        <button class="btn-action" onclick="viewStockDetails('${result.symbol}')">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="btn-action" onclick="addToWatchlist('${result.symbol}')">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    formatVolume(volume) {
        if (volume >= 10000000) {
            return (volume / 10000000).toFixed(2) + 'Cr';
        } else if (volume >= 100000) {
            return (volume / 100000).toFixed(2) + 'L';
        } else {
            return volume.toLocaleString();
        }
    }
    
    async saveResultsToDB(results) {
        // In production, send to PHP backend to save in database
        try {
            const response = await fetch('/php/scanner.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'save_results',
                    results: results
                })
            });
            
            const data = await response.json();
            console.log('Results saved:', data);
        } catch (error) {
            console.error('Failed to save results:', error);
        }
    }
    
    exportToExcel() {
        if (this.scanResults.length === 0) {
            this.showError('No results to export');
            return;
        }
        
        // Create CSV content
        const headers = ['Symbol', 'Pattern', 'Confidence', 'Price', 'Change', 'Volume', 'Time'];
        const csvContent = [
            headers.join(','),
            ...this.scanResults.map(r => [
                r.symbol,
                r.pattern,
                r.confidence,
                r.price,
                r.change,
                r.volume,
                r.time
            ].join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `volume_patterns_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showSuccess('Results exported to CSV');
    }
    
    clearResults() {
        if (confirm('Are you sure you want to clear all results?')) {
            this.scanResults = [];
            this.updateResultsTable([]);
            this.updateStatistics([]);
            this.showSuccess('Results cleared');
        }
    }
    
    savePreset() {
        const params = this.getScannerParams();
        const presetName = prompt('Enter preset name:');
        
        if (!presetName) return;
        
        // Save to localStorage for demo
        // In production, save to database via PHP backend
        const presets = JSON.parse(localStorage.getItem('scannerPresets') || '[]');
        presets.push({
            name: presetName,
            params: params,
            created: new Date().toISOString()
        });
        
        localStorage.setItem('scannerPresets', JSON.stringify(presets));
        this.showSuccess(`Preset "${presetName}" saved`);
    }
    
    startTimer() {
        this.scanStartTime = Date.now();
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.scanStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            
            const timerElement = document.getElementById('scanTimer');
            if (timerElement) {
                timerElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateUI() {
        const runBtn = document.getElementById('runScan');
        const stopBtn = document.getElementById('stopScan');
        const statusDot = document.querySelector('.status-dot');
        
        if (this.isScanning) {
            if (runBtn) runBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            if (statusDot) {
                statusDot.className = 'status-dot scanning';
            }
        } else {
            if (runBtn) runBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;
            if (statusDot) {
                statusDot.className = 'status-dot ready';
            }
        }
    }
    
    showError(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.scanner = new VolumePatternScanner();
    
    // Demo functions
    window.viewStockDetails = function(symbol) {
        alert(`Viewing details for ${symbol}`);
        // In production, this would open a detailed chart
    };
    
    window.addToWatchlist = function(symbol) {
        alert(`${symbol} added to watchlist`);
        // In production, this would add to user's watchlist
    };
});
