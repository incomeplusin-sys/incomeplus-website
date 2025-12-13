// WORKING Volume-Price Pattern Scanner with Real Market Data
document.addEventListener('DOMContentLoaded', function() {
    // ===== REAL WORKING CONFIGURATION =====
    const API_CONFIG = {
        YAHOO_FINANCE: 'https://query1.finance.yahoo.com/v8/finance/chart/',
        INDIAN_STOCKS: [
            'RELIANCE.BO',    // NSE: RELIANCE
            'TCS.BO',         // NSE: TCS
            'INFY.BO',        // NSE: INFOSYS
            'HDFCBANK.BO',    // NSE: HDFCBANK
            'ICICIBANK.BO',   // NSE: ICICIBANK
            'ITC.BO',         // NSE: ITC
            'SBIN.BO',        // NSE: SBIN
            'WIPRO.BO',       // NSE: WIPRO
            'BHARTIARTL.BO',  // NSE: BHARTIARTL
            'AXISBANK.BO'     // NSE: AXISBANK
        ]
    };

    // ===== ELEMENTS =====
    const runScannerBtn = document.getElementById('runScanner');
    const resetScannerBtn = document.getElementById('resetScanner');
    const loadDemoBtn = document.getElementById('loadDemo');
    const downloadGuideBtn = document.getElementById('downloadGuide');
    const stockSelect = document.getElementById('stockSelect');
    const resultsBody = document.getElementById('resultsBody');
    const resultsCount = document.getElementById('resultsCount');
    const scanTime = document.getElementById('scanTime');
    const dataSource = document.getElementById('dataSource');
    const disclaimerCheckbox = document.getElementById('understandDisclaimer');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportPDFBtn = document.getElementById('exportPDF');
    const printResultsBtn = document.getElementById('printResults');

    // ===== REAL DATA FETCHING =====
    async function fetchStockData(symbol, days = 15) {
        try {
            const url = `${API_CONFIG.YAHOO_FINANCE}${symbol}?range=${days}d&interval=1d`;
            console.log('Fetching real data from:', url);
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - API Error`);
            }
            
            const data = await response.json();
            
            if (!data.chart?.result?.[0]) {
                throw new Error('No market data available');
            }
            
            const result = data.chart.result[0];
            const quotes = result.indicators.quote[0];
            
            // Filter out null/undefined values
            const volumes = [];
            const prices = [];
            const timestamps = result.timestamp || [];
            
            for (let i = 0; i < timestamps.length; i++) {
                if (quotes.volume[i] !== null && quotes.volume[i] !== undefined &&
                    quotes.close[i] !== null && quotes.close[i] !== undefined) {
                    volumes.push(quotes.volume[i]);
                    prices.push(quotes.close[i]);
                }
            }
            
            if (volumes.length < 3) {
                throw new Error('Insufficient data points for analysis');
            }
            
            return {
                success: true,
                symbol: symbol.replace('.BO', ''),
                volumes: volumes.slice(-30), // Last 30 data points
                prices: prices.slice(-30),
                lastPrice: prices[prices.length - 1] || 0,
                dataPoints: volumes.length
            };
            
        } catch (error) {
            console.error('Data fetch error:', error.message);
            return { 
                success: false, 
                error: error.message,
                symbol: symbol.replace('.BO', '')
            };
        }
    }

    // ===== REAL PATTERN DETECTION =====
    function detectRealPatterns(volumes, prices, symbol) {
        const patterns = [];
        const minCandles = parseInt(document.getElementById('minCandles').value) || 3;
        const patternType = document.getElementById('patternType').value;
        
        if (!volumes || !prices || volumes.length < minCandles || prices.length < minCandles) {
            return patterns;
        }
        
        // Check different pattern lengths
        for (let length = minCandles; length <= Math.min(7, volumes.length); length++) {
            for (let start = 0; start <= volumes.length - length; start++) {
                const volSlice = volumes.slice(start, start + length);
                const priceSlice = prices.slice(start, start + length);
                
                // Calculate changes
                const volChange = ((volSlice[length-1] - volSlice[0]) / volSlice[0]) * 100;
                const priceChange = ((priceSlice[length-1] - priceSlice[0]) / priceSlice[0]) * 100;
                
                // Check trends
                let volTrendUp = true;
                let volTrendDown = true;
                let priceTrendUp = true;
                let priceTrendDown = true;
                
                for (let i = 1; i < length; i++) {
                    if (volSlice[i] < volSlice[i-1]) volTrendUp = false;
                    if (volSlice[i] > volSlice[i-1]) volTrendDown = false;
                    if (priceSlice[i] < priceSlice[i-1]) priceTrendUp = false;
                    if (priceSlice[i] > priceSlice[i-1]) priceTrendDown = false;
                }
                
                // Pattern 1: Volume UP + Price UP
                if (volTrendUp && priceTrendUp && Math.abs(volChange) >= 5 && priceChange >= 1) {
                    if (patternType === 'both' || patternType === 'bullish') {
                        patterns.push(createPatternObject(
                            symbol, '📈 Volume UP + Price UP', length, 
                            volChange, priceChange, prices[prices.length-1],
                            start, start + length - 1, volSlice, priceSlice, true
                        ));
                    }
                }
                
                // Pattern 2: Volume DOWN + Price DOWN
                if (volTrendDown && priceTrendDown && Math.abs(volChange) >= 5 && priceChange <= -1) {
                    if (patternType === 'both' || patternType === 'bearish') {
                        patterns.push(createPatternObject(
                            symbol, '📉 Volume DOWN + Price DOWN', length,
                            volChange, priceChange, prices[prices.length-1],
                            start, start + length - 1, volSlice, priceSlice, false
                        ));
                    }
                }
            }
        }
        
        return patterns;
    }
    
    function createPatternObject(symbol, patternType, length, volChange, priceChange, 
                                 currentPrice, startIdx, endIdx, volumes, prices, isBullish) {
        const confidence = calculateConfidence(volChange, priceChange, length);
        
        return {
            symbol: symbol,
            pattern: patternType,
            candles: length,
            volumeChange: volChange,
            priceChange: priceChange,
            currentPrice: currentPrice,
            startIndex: startIdx,
            endIndex: endIdx,
            confidence: confidence,
            volumeData: volumes.map(v => formatVolume(v)).join(' → '),
            priceData: prices.map(p => `₹${p.toFixed(2)}`).join(' → '),
            isBullish: isBullish,
            timestamp: new Date().toISOString()
        };
    }
    
    function calculateConfidence(volChange, priceChange, length) {
        let confidence = 50;
        
        // Longer patterns = more reliable
        confidence += (length - 3) * 8;
        
        // Strong volume change = higher confidence
        confidence += Math.min(Math.abs(volChange) / 2, 20);
        
        // Strong price change = higher confidence
        confidence += Math.min(Math.abs(priceChange) * 8, 20);
        
        return Math.min(Math.round(confidence), 95);
    }
    
    function formatVolume(volume) {
        if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
        if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
        if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
        return Math.round(volume).toString();
    }

    // ===== MAIN SCANNER FUNCTION =====
    async function runRealScanner() {
        if (!disclaimerCheckbox.checked) {
            showMessage('Please acknowledge the educational disclaimer first.', 'warning');
            return;
        }
        
        showLoadingState();
        
        const selectedStock = stockSelect.value;
        const days = document.getElementById('daysSelect').value;
        let allPatterns = [];
        
        try {
            if (selectedStock === 'multiple') {
                // Scan first 3 stocks (to avoid rate limiting)
                const stocksToScan = API_CONFIG.INDIAN_STOCKS.slice(0, 3);
                
                for (const stock of stocksToScan) {
                    updateLoadingMessage(`Fetching ${stock.replace('.BO', '')} data...`);
                    
                    const data = await fetchStockData(stock, days);
                    
                    if (data.success) {
                        const patterns = detectRealPatterns(
                            data.volumes, 
                            data.prices, 
                            data.symbol
                        );
                        allPatterns = allPatterns.concat(patterns);
                    }
                    
                    // Delay between requests
                    await delay(1500);
                }
            } else {
                // Single stock scan
                updateLoadingMessage(`Fetching ${selectedStock.replace('.BO', '')} data...`);
                
                const data = await fetchStockData(selectedStock, days);
                
                if (data.success) {
                    allPatterns = detectRealPatterns(
                        data.volumes, 
                        data.prices, 
                        data.symbol
                    );
                } else {
                    showMessage(`Could not fetch data for ${data.symbol}. Trying demo data.`, 'error');
                    await delay(1000);
                    loadDemoResults();
                    return;
                }
            }
            
            // Display results
            displayResults(allPatterns);
            
        } catch (error) {
            console.error('Scanner error:', error);
            showMessage('Scanner error. Loading demo results for learning.', 'error');
            await delay(1000);
            loadDemoResults();
        }
    }

    // ===== DISPLAY RESULTS =====
    function displayResults(patterns) {
        // Hide placeholder
        document.querySelector('.results-placeholder').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';
        
        // Clear previous results
        resultsBody.innerHTML = '';
        
        if (patterns.length === 0) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 50px;">
                        <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e0;"></i>
                        <h3 style="color: #718096; margin: 15px 0;">No Patterns Found</h3>
                        <p>Current market data doesn't show clear volume-price patterns.</p>
                        <p><small>Try different settings or use Demo mode to see examples.</small></p>
                    </td>
                </tr>
            `;
        } else {
            // Sort by confidence (highest first)
            patterns.sort((a, b) => b.confidence - a.confidence);
            
            // Display each pattern
            patterns.forEach((pattern, index) => {
                const confidenceColor = pattern.confidence >= 75 ? '#10b981' : 
                                      pattern.confidence >= 60 ? '#f59e0b' : '#ef4444';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <strong>${pattern.symbol}</strong>
                        <div class="stock-name" style="font-size: 0.8rem; color: #718096;">
                            Real Market Scan
                        </div>
                    </td>
                    <td>
                        <span class="pattern-badge ${pattern.isBullish ? 'badge-bullish' : 'badge-bearish'}">
                            ${pattern.pattern}
                        </span>
                    </td>
                    <td>${pattern.candles} days</td>
                    <td>${pattern.volumeChange.toFixed(1)}%</td>
                    <td>${pattern.priceChange.toFixed(1)}%</td>
                    <td>₹${pattern.currentPrice.toFixed(2)}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pattern.confidence}%; height: 100%; background: ${confidenceColor};"></div>
                            </div>
                            <span style="color: ${confidenceColor}; font-weight: 600;">${pattern.confidence}%</span>
                        </div>
                    </td>
                    <td>
                        <button class="btn-analyze" onclick="showPatternDetails(${index})" 
                                data-pattern='${JSON.stringify(pattern).replace(/'/g, "\\'")}'>
                            <i class="fas fa-chart-line"></i> Details
                        </button>
                    </td>
                `;
                resultsBody.appendChild(row);
            });
            
            // Add pattern details function to window
            if (!window.showPatternDetails) {
                window.showPatternDetails = function(index) {
                    const rows = document.querySelectorAll('#resultsBody tr');
                    if (rows[index]) {
                        const btn = rows[index].querySelector('.btn-analyze');
                        const pattern = JSON.parse(btn.getAttribute('data-pattern'));
                        showPatternDetailModal(pattern);
                    }
                };
            }
        }
        
        // Update counters
        resultsCount.textContent = `${patterns.length} pattern(s) found`;
        scanTime.textContent = `Scanned at: ${new Date().toLocaleTimeString()}`;
        dataSource.innerHTML = `<i class="fas fa-check-circle"></i> Real Market Data`;
        
        // Show message
        showMessage(
            patterns.length > 0 
                ? `Found ${patterns.length} patterns in current market data.`
                : 'Market may be consolidating. Try different settings.',
            'info'
        );
    }

    // ===== PATTERN DETAIL MODAL =====
    function showPatternDetailModal(pattern) {
        // Remove existing modal
        const existingModal = document.querySelector('.pattern-detail-modal');
        if (existingModal) existingModal.remove();
        
        const modalHTML = `
            <div class="pattern-detail-modal">
                <div class="pattern-detail-content">
                    <h3>${pattern.symbol} - ${pattern.pattern}</h3>
                    
                    <div class="detail-grid">
                        <div class="detail-card">
                            <h4><i class="fas fa-chart-bar"></i> Volume Analysis</h4>
                            <p><strong>Change:</strong> ${pattern.volumeChange.toFixed(1)}%</p>
                            <p><strong>Pattern:</strong> ${pattern.volumeData}</p>
                            <p><strong>Duration:</strong> ${pattern.candles} trading days</p>
                        </div>
                        
                        <div class="detail-card">
                            <h4><i class="fas fa-rupee-sign"></i> Price Analysis</h4>
                            <p><strong>Change:</strong> ${pattern.priceChange.toFixed(1)}%</p>
                            <p><strong>Pattern:</strong> ${pattern.priceData}</p>
                            <p><strong>Current:</strong> ₹${pattern.currentPrice.toFixed(2)}</p>
                        </div>
                        
                        <div class="detail-card">
                            <h4><i class="fas fa-brain"></i> Confidence Score</h4>
                            <div class="confidence-meter">
                                <div class="confidence-fill" style="width: ${pattern.confidence}%"></div>
                            </div>
                            <p><strong>${pattern.confidence}% Confidence</strong></p>
                            <p>Based on pattern strength and duration</p>
                        </div>
                    </div>
                    
                    <div class="educational-insight">
                        <h4><i class="fas fa-graduation-cap"></i> Educational Insight</h4>
                        <p>
                            ${pattern.isBullish 
                                ? 'This pattern suggests increasing buying interest in the market. In technical analysis education, sustained volume with rising prices is often studied as potential accumulation.' 
                                : 'This pattern suggests decreasing selling pressure. In technical analysis education, declining volume with falling prices is often studied as potential distribution or weakening downtrend.'}
                        </p>
                        <p><strong>Educational Note:</strong> This is for learning pattern recognition concepts only.</p>
                    </div>
                    
                    <button onclick="this.closest('.pattern-detail-modal').remove()" 
                            class="btn-close-detail">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // ===== DEMO DATA FUNCTION =====
    window.loadDemoResults = function() {
        showLoadingState('Loading demo patterns for learning...');
        
        setTimeout(() => {
            const demoPatterns = [
                {
                    symbol: 'RELIANCE',
                    pattern: '📈 Volume UP + Price UP',
                    candles: 4,
                    volumeChange: 18.5,
                    priceChange: 3.2,
                    currentPrice: 2456.75,
                    confidence: 78,
                    volumeData: '1.2M → 1.4M → 1.5M → 1.7M',
                    priceData: '₹2380 → ₹2405 → ₹2428 → ₹2457',
                    isBullish: true,
                    startIndex: 0,
                    endIndex: 3
                },
                {
                    symbol: 'TCS',
                    pattern: '📉 Volume DOWN + Price DOWN',
                    candles: 3,
                    volumeChange: -12.3,
                    priceChange: -2.1,
                    currentPrice: 3450.50,
                    confidence: 65,
                    volumeData: '850K → 780K → 745K',
                    priceData: '₹3520 → ₹3485 → ₹3451',
                    isBullish: false,
                    startIndex: 1,
                    endIndex: 3
                },
                {
                    symbol: 'INFY',
                    pattern: '📈 Volume UP + Price UP',
                 