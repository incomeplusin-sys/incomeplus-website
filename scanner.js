// REAL WORKING Volume-Price Pattern Scanner
document.addEventListener('DOMContentLoaded', function() {
    // ===== REAL WORKING CONFIGURATION =====
    const API_CONFIG = {
        // Free APIs that work without registration
        YAHOO_FINANCE: 'https://query1.finance.yahoo.com/v8/finance/chart/',
        ALPHA_VANTAGE: 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=',
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
        ],
        // Backup Indian indices if stock APIs fail
        NIFTY_50: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=30d'
    };

    // ===== ELEMENTS =====
    const runScannerBtn = document.getElementById('runScanner');
    const resetScannerBtn = document.getElementById('resetScanner');
    const loadDemoBtn = document.getElementById('loadDemo');
    const stockSelect = document.getElementById('stockSelect');
    const resultsBody = document.getElementById('resultsBody');
    const resultsCount = document.getElementById('resultsCount');
    const scanTime = document.getElementById('scanTime');

    // ===== REAL DATA FETCHING =====
    
    // Method 1: Yahoo Finance API (Most Reliable)
    async function fetchFromYahoo(symbol, days = 15) {
        try {
            const url = `${API_CONFIG.YAHOO_FINANCE}${symbol}?range=${days}d&interval=1d`;
            console.log('Fetching from Yahoo:', url);
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (!data.chart?.result?.[0]) {
                throw new Error('No data in response');
            }
            
            const result = data.chart.result[0];
            const timestamps = result.timestamp || [];
            const quotes = result.indicators.quote[0] || {};
            
            if (!quotes.volume || quotes.volume.length < 3) {
                throw new Error('Insufficient volume data');
            }
            
            // Filter out null values
            const volumes = [];
            const prices = [];
            const dates = [];
            
            for (let i = 0; i < timestamps.length; i++) {
                if (quotes.volume[i] && quotes.close[i]) {
                    volumes.push(quotes.volume[i]);
                    prices.push(quotes.close[i]);
                    dates.push(new Date(timestamps[i] * 1000).toLocaleDateString());
                }
            }
            
            console.log(`Fetched ${volumes.length} days of data for ${symbol}`);
            
            return {
                success: true,
                symbol: symbol.replace('.BO', ''),
                volumes: volumes.slice(-20), // Last 20 days
                prices: prices.slice(-20),
                dates: dates.slice(-20),
                lastUpdated: new Date().toLocaleString()
            };
            
        } catch (error) {
            console.error('Yahoo API error:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // Method 2: Alpha Vantage (Backup)
    async function fetchFromAlphaVantage(symbol) {
        try {
            // Note: Requires free API key from alphavantage.co
            const apiKey = 'demo'; // Replace with your free key
            const url = `${API_CONFIG.ALPHA_VANTAGE}${symbol}&apikey=${apiKey}&outputsize=compact`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            
            const timeSeries = data['Time Series (Daily)'];
            const volumes = [];
            const prices = [];
            const dates = [];
            
            let count = 0;
            for (const date in timeSeries) {
                if (count >= 20) break;
                volumes.push(parseFloat(timeSeries[date]['5. volume']));
                prices.push(parseFloat(timeSeries[date]['4. close']));
                dates.push(date);
                count++;
            }
            
            return {
                success: true,
                symbol: symbol,
                volumes: volumes.reverse(),
                prices: prices.reverse(),
                dates: dates.reverse()
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Method 3: Fallback to Nifty 50 data
    async function fetchNiftyData() {
        try {
            const response = await fetch(API_CONFIG.NIFTY_50);
            const data = await response.json();
            
            const result = data.chart.result[0];
            const quotes = result.indicators.quote[0];
            
            const volumes = quotes.volume.slice(-20).filter(v => v);
            const prices = quotes.close.slice(-20).filter(p => p);
            
            return {
                success: true,
                symbol: 'NIFTY50',
                volumes: volumes,
                prices: prices,
                dates: result.timestamp.slice(-20).map(ts => 
                    new Date(ts * 1000).toLocaleDateString()
                )
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // ===== REAL PATTERN DETECTION ALGORITHM =====
    
    function detectVolumePricePatterns(volumes, prices, symbol) {
        const patterns = [];
        const minCandles = parseInt(document.getElementById('minCandles').value) || 3;
        const patternType = document.getElementById('patternType').value;
        
        if (volumes.length < minCandles || prices.length < minCandles) {
            return patterns;
        }
        
        // Look for patterns of different lengths
        for (let length = minCandles; length <= Math.min(7, volumes.length); length++) {
            for (let start = 0; start <= volumes.length - length; start++) {
                const end = start + length - 1;
                
                const volSlice = volumes.slice(start, end + 1);
                const priceSlice = prices.slice(start, end + 1);
                
                // Skip if any invalid data
                if (volSlice.some(v => !v || v <= 0) || priceSlice.some(p => !p || p <= 0)) {
                    continue;
                }
                
                // Calculate trends with tolerance
                let volTrend = 0;
                let priceTrend = 0;
                
                for (let i = 0; i < length - 1; i++) {
                    volTrend += volSlice[i + 1] - volSlice[i];
                    priceTrend += priceSlice[i + 1] - priceSlice[i];
                }
                
                // Calculate percentages
                const volChangePct = ((volSlice[length - 1] - volSlice[0]) / volSlice[0]) * 100;
                const priceChangePct = ((priceSlice[length - 1] - priceSlice[0]) / priceSlice[0]) * 100;
                
                // Check for Volume UP + Price UP pattern
                if (volTrend > 0 && priceTrend > 0 && 
                    Math.abs(volChangePct) >= 5 && priceChangePct >= 1) {
                    
                    if (patternType === 'both' || patternType === 'bullish') {
                        patterns.push({
                            symbol: symbol,
                            pattern: '📈 Volume UP + Price UP',
                            candles: length,
                            volumeChange: volChangePct,
                            priceChange: priceChangePct,
                            currentPrice: prices[prices.length - 1],
                            startIndex: start,
                            endIndex: end,
                            volumeData: volSlice.map(v => formatVolume(v)).join(' → '),
                            priceData: priceSlice.map(p => `₹${p.toFixed(2)}`).join(' → '),
                            confidence: calculateConfidence(volChangePct, priceChangePct, length)
                        });
                    }
                }
                
                // Check for Volume DOWN + Price DOWN pattern
                if (volTrend < 0 && priceTrend < 0 && 
                    Math.abs(volChangePct) >= 5 && priceChangePct <= -1) {
                    
                    if (patternType === 'both' || patternType === 'bearish') {
                        patterns.push({
                            symbol: symbol,
                            pattern: '📉 Volume DOWN + Price DOWN',
                            candles: length,
                            volumeChange: volChangePct,
                            priceChange: priceChangePct,
                            currentPrice: prices[prices.length - 1],
                            startIndex: start,
                            endIndex: end,
                            volumeData: volSlice.map(v => formatVolume(v)).join(' → '),
                            priceData: priceSlice.map(p => `₹${p.toFixed(2)}`).join(' → '),
                            confidence: calculateConfidence(volChangePct, priceChangePct, length)
                        });
                    }
                }
            }
        }
        
        return patterns;
    }
    
    // Helper functions
    function formatVolume(volume) {
        if (volume >= 10000000) return `${(volume / 10000000).toFixed(1)}Cr`;
        if (volume >= 100000) return `${(volume / 100000).toFixed(1)}L`;
        if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
        return volume.toFixed(0);
    }
    
    function calculateConfidence(volChange, priceChange, length) {
        let confidence = 50;
        
        // Longer patterns are more reliable
        confidence += (length - 3) * 10;
        
        // Stronger volume changes increase confidence
        confidence += Math.min(Math.abs(volChange) / 2, 20);
        
        // Stronger price changes increase confidence
        confidence += Math.min(Math.abs(priceChange) * 10, 20);
        
        return Math.min(Math.round(confidence), 95);
    }
    
    // ===== MAIN SCANNER FUNCTION =====
    
    async function runRealScanner() {
        showLoadingState('Scanning real market data...');
        
        const selectedStock = stockSelect.value;
        const days = document.getElementById('daysSelect').value;
        let allPatterns = [];
        
        try {
            if (selectedStock === 'multiple') {
                // Scan all Indian stocks
                for (const stock of API_CONFIG.INDIAN_STOCKS.slice(0, 5)) {
                    showLoadingState(`Scanning ${stock.replace('.BO', '')}...`);
                    
                    const data = await fetchFromYahoo(stock, days);
                    
                    if (data.success) {
                        const patterns = detectVolumePricePatterns(
                            data.volumes, 
                            data.prices, 
                            data.symbol
                        );
                        
                        allPatterns = allPatterns.concat(patterns);
                    }
                    
                    // Delay to avoid rate limiting
                    await delay(1000);
                }
            } else {
                // Scan single stock
                const data = await fetchFromYahoo(selectedStock, days);
                
                if (data.success) {
                    allPatterns = detectVolumePricePatterns(
                        data.volumes, 
                        data.prices, 
                        data.symbol
                    );
                } else {
                    // Try fallback
                    const niftyData = await fetchNiftyData();
                    if (niftyData.success) {
                        allPatterns = detectVolumePricePatterns(
                            niftyData.volumes,
                            niftyData.prices,
                            'NIFTY50'
                        );
                    }
                }
            }
            
            // Display results
            displayRealResults(allPatterns);
            
        } catch (error) {
            console.error('Scanner error:', error);
            showErrorState('Network or API error. Try Demo mode or check console.');
        }
    }
    
    // ===== DISPLAY REAL RESULTS =====
    
    function displayRealResults(patterns) {
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
                        <h3 style="color: #718096; margin: 15px 0;">No Real Patterns Detected</h3>
                        <p>Current market data doesn't show clear volume-price patterns.</p>
                        <p><small>Try different stocks or time periods.</small></p>
                    </td>
                </tr>
            `;
        } else {
            // Sort by confidence (highest first)
            patterns.sort((a, b) => b.confidence - a.confidence);
            
            // Display each pattern
            patterns.forEach((pattern, index) => {
                const isBullish = pattern.pattern.includes('UP');
                const confidenceColor = pattern.confidence >= 70 ? '#10b981' : 
                                      pattern.confidence >= 50 ? '#f59e0b' : '#ef4444';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <strong>${pattern.symbol}</strong>
                        <div class="stock-name">Real Market Data</div>
                    </td>
                    <td>
                        <span class="pattern-badge ${isBullish ? 'badge-bullish' : 'badge-bearish'}">
                            ${pattern.pattern}
                        </span>
                        <div style="font-size: 0.8rem; color: #718096; margin-top: 3px;">
                            Confidence: <span style="color: ${confidenceColor}; font-weight: bold;">
                                ${pattern.confidence}%
                            </span>
                        </div>
                    </td>
                    <td>${pattern.candles} candles</td>
                    <td>${pattern.volumeChange.toFixed(1)}%</td>
                    <td>${pattern.priceChange.toFixed(1)}%</td>
                    <td>₹${pattern.currentPrice.toFixed(2)}</td>
                    <td>Candles ${pattern.startIndex + 1}-${pattern.endIndex + 1}</td>
                    <td>
                        <button class="btn-analyze" onclick="showPatternDetails(${index})" 
                                data-pattern='${JSON.stringify(pattern).replace(/'/g, "\\'")}'>
                            <i class="fas fa-chart-line"></i> Details
                        </button>
                    </td>
                `;
                resultsBody.appendChild(row);
            });
        }
        
        // Update counters
        resultsCount.textContent = `${patterns.length} real pattern(s) found`;
        scanTime.textContent = `Scanned at: ${new Date().toLocaleTimeString()}`;
        
        // Show educational message
        showEducationalMessage(
            patterns.length > 0 
                ? `Found ${patterns.length} real volume-price patterns in current market data.`
                : 'No clear patterns detected. Market may be consolidating.'
        );
    }
    
    // ===== DETAILED PATTERN VIEW =====
    
    window.showPatternDetails = function(index) {
        // Get all patterns from table
        const rows = document.querySelectorAll('#resultsBody tr');
        if (rows[index]) {
            const btn = rows[index].querySelector('.btn-analyze');
            const patternData = JSON.parse(btn.getAttribute('data-pattern'));
            
            // Create detailed view
            const detailHtml = `
                <div class="pattern-detail-modal">
                    <div class="pattern-detail-content">
                        <h3>${patternData.symbol} - ${patternData.pattern}</h3>
                        
                        <div class="detail-grid">
                            <div class="detail-card">
                                <h4><i class="fas fa-chart-bar"></i> Volume Analysis</h4>
                                <p><strong>Change:</strong> ${patternData.volumeChange.toFixed(1)}%</p>
                                <p><strong>Trend:</strong> ${patternData.volumeData}</p>
                                <p><strong>Pattern Length:</strong> ${patternData.candles} candles</p>
                            </div>
                            
                            <div class="detail-card">
                                <h4><i class="fas fa-rupee-sign"></i> Price Analysis</h4>
                                <p><strong>Change:</strong> ${patternData.priceChange.toFixed(1)}%</p>
                                <p><strong>Trend:</strong> ${patternData.priceData}</p>
                                <p><strong>Current Price:</strong> ₹${patternData.currentPrice.toFixed(2)}</p>
                            </div>
                            
                            <div class="detail-card">
                                <h4><i class="fas fa-brain"></i> Confidence Score</h4>
                                <div class="confidence-meter">
                                    <div class="confidence-fill" style="width: ${patternData.confidence}%"></div>
                                </div>
                                <p><strong>${patternData.confidence}% Confidence</strong></p>
                                <p>Based on pattern strength and duration</p>
                            </div>
                        </div>
                        
                        <div class="educational-insight">
                            <h4><i class="fas fa-graduation-cap"></i> Educational Insight</h4>
                            <p>
                                ${patternData.pattern.includes('UP') 
                                    ? 'This pattern suggests increasing buying interest. In technical analysis education, this is often studied as potential accumulation.' 
                                    : 'This pattern suggests decreasing selling pressure. In technical analysis education, this is often studied as potential distribution.'}
                            </p>
                            <p><strong>Remember:</strong> This is for learning pattern recognition only.</p>
                        </div>
                        
                        <button onclick="this.closest('.pattern-detail-modal').remove()" 
                                class="btn-close-detail">
                            <i class="fas fa-times"></i> Close
                        </button>
      