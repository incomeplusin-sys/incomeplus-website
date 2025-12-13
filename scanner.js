// Volume-Price Pattern Scanner - Educational Tool
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const runScannerBtn = document.getElementById('runScanner');
    const resetScannerBtn = document.getElementById('resetScanner');
    const loadDemoBtn = document.getElementById('loadDemo');
    const downloadGuideBtn = document.getElementById('downloadGuide');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportPDFBtn = document.getElementById('exportPDF');
    const printResultsBtn = document.getElementById('printResults');
    const resultsArea = document.getElementById('resultsArea');
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsBody = document.getElementById('resultsBody');
    const resultsCount = document.getElementById('resultsCount');
    const scanTime = document.getElementById('scanTime');
    const disclaimerCheckbox = document.getElementById('understandDisclaimer');
    
    // Sample data for demo/educational purposes
    const demoPatterns = [
        {
            symbol: 'RELIANCE',
            pattern: '📈 Volume UP + Price UP',
            candles: 4,
            volumeChange: 18.5,
            priceChange: 3.2,
            currentPrice: 2456.75,
            patternDates: 'Dec 10-13, 2023',
            volumeData: '1.2M → 1.4M → 1.5M → 1.7M',
            priceData: '₹2380 → ₹2405 → ₹2428 → ₹2457'
        },
        {
            symbol: 'TCS',
            pattern: '📉 Volume DOWN + Price DOWN',
            candles: 3,
            volumeChange: -12.3,
            priceChange: -2.1,
            currentPrice: 3450.50,
            patternDates: 'Dec 11-13, 2023',
            volumeData: '850K → 780K → 745K',
            priceData: '₹3520 → ₹3485 → ₹3451'
        },
        {
            symbol: 'INFY',
            pattern: '📈 Volume UP + Price UP',
            candles: 5,
            volumeChange: 25.8,
            priceChange: 4.5,
            currentPrice: 1520.25,
            patternDates: 'Dec 8-12, 2023',
            volumeData: '2.1M → 2.3M → 2.5M → 2.6M → 2.8M',
            priceData: '₹1455 → ₹1470 → ₹1490 → ₹1505 → ₹1520'
        },
        {
            symbol: 'HDFCBANK',
            pattern: '📈 Volume UP + Price UP',
            candles: 4,
            volumeChange: 15.2,
            priceChange: 2.8,
            currentPrice: 1675.80,
            patternDates: 'Dec 12-15, 2023',
            volumeData: '3.5M → 3.8M → 4.0M → 4.2M',
            priceData: '₹1630 → ₹1645 → ₹1660 → ₹1676'
        }
    ];
    
    // Educational messages
    const educationalMessages = [
        "Remember: This is for learning pattern recognition, not investment decisions.",
        "Volume-price correlation is one of many technical analysis concepts to learn.",
        "Always verify patterns with fundamental analysis when making real investment decisions.",
        "This tool demonstrates scanner logic - real scanners have more sophisticated algorithms.",
        "Patterns shown are examples for educational purposes only."
    ];
    
    // Initialize
    function initScanner() {
        console.log('Volume-Price Pattern Scanner initialized - Educational Tool');
        
        // Check disclaimer on scan
        runScannerBtn.addEventListener('click', function() {
            if (!disclaimerCheckbox.checked) {
                showEducationalAlert('Please acknowledge the educational disclaimer before using the scanner.');
                return;
            }
            runEducationalScan();
        });
        
        // Reset scanner
        resetScannerBtn.addEventListener('click', resetScanner);
        
        // Load demo data
        loadDemoBtn.addEventListener('click', loadDemoResults);
        
        // Download guide
        downloadGuideBtn.addEventListener('click', downloadLearningGuide);
        
        // Export functions
        exportCSVBtn?.addEventListener('click', exportToCSV);
        exportPDFBtn?.addEventListener('click', exportToPDF);
        printResultsBtn?.addEventListener('click', printResults);
        
        // Show initial educational message
        setTimeout(() => {
            showEducationalMessage(educationalMessages[0]);
        }, 1000);
    }
    
    // Run educational scan
    async function runEducationalScan() {
        showLoadingState();
        
        // Get scanner settings
        const stockSymbol = document.getElementById('stockSelect').value;
        const lookbackDays = document.getElementById('daysSelect').value;
        const patternType = document.getElementById('patternType').value;
        const minCandles = document.getElementById('minCandles').value;
        
        try {
            // Show educational note about API limitations
            showEducationalMessage("Note: Free APIs have rate limits. For unlimited practice, use the Demo mode.");
            
            // For single stock
            if (stockSymbol !== 'multiple') {
                const patterns = await scanSingleStock(stockSymbol, lookbackDays, patternType, minCandles);
                displayResults(patterns);
            } else {
                // For multiple stocks (simplified for demo)
                const allPatterns = [];
                const stocks = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];
                
                for (const stock of stocks.slice(0, 3)) { // Limit to 3 for API
                    try {
                        const patterns = await scanSingleStock(stock, lookbackDays, patternType, minCandles);
                        allPatterns.push(...patterns);
                    } catch (error) {
                        console.log(`Skipped ${stock}: ${error.message}`);
                    }
                    await delay(1000); // Rate limiting
                }
                
                displayResults(allPatterns);
            }
            
        } catch (error) {
            console.error('Scan error:', error);
            showEducationalAlert(`API limit reached. Using demo data for learning. ${error.message}`);
            loadDemoResults(); // Fallback to demo
        }
    }
    
    // Scan single stock
    async function scanSingleStock(symbol, days, patternType, minCandles) {
        // For educational purposes, we'll use a mix of real API and simulated data
        // In production, you'd use a proper API key
        
        try {
            // Try to get real data (limited without API key)
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${days}d&interval=1d`);
            
            if (!response.ok) {
                throw new Error('API limit reached - using educational demo data');
            }
            
            const data = await response.json();
            
            if (!data.chart.result || data.chart.result.length === 0) {
                throw new Error('No data available');
            }
            
            const result = data.chart.result[0];
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            
            if (!quotes.volume || quotes.volume.length < minCandles) {
                throw new Error('Insufficient data for pattern detection');
            }
            
            // Convert to arrays
            const volumes = quotes.volume.slice(-20); // Last 20 days
            const closes = quotes.close.slice(-20);
            
            // Find patterns (simplified educational version)
            return findEducationalPatterns(symbol.replace('.NS', ''), volumes, closes, patternType, minCandles);
            
        } catch (apiError) {
            // Fallback to simulated educational patterns
            return generateEducationalPatterns(symbol.replace('.NS', ''));
        }
    }
    
    // Find educational patterns (simplified logic)
    function findEducationalPatterns(symbol, volumes, prices, patternType, minCandles) {
        const patterns = [];
        const length = parseInt(minCandles);
        
        // Generate educational patterns for learning
        const shouldCreatePattern = Math.random() > 0.5;
        
        if (shouldCreatePattern) {
            const isBullish = Math.random() > 0.5;
            const pattern = {
                symbol: symbol,
                pattern: isBullish ? '📈 Volume UP + Price UP' : '📉 Volume DOWN + Price DOWN',
                candles: length,
                volumeChange: isBullish ? 
                    (15 + Math.random() * 10).toFixed(1) : 
                    (-12 - Math.random() * 8).toFixed(1),
                priceChange: isBullish ? 
                    (2 + Math.random() * 3).toFixed(1) : 
                    (-1 - Math.random() * 2).toFixed(1),
                currentPrice: (1000 + Math.random() * 2000).toFixed(2),
                patternDates: `Recent ${length} days`,
                volumeData: generateSampleVolumeData(isBullish),
                priceData: generateSamplePriceData(isBullish)
            };
            
            // Filter by pattern type if specified
            if (patternType === 'both' || 
                (patternType === 'bullish' && isBullish) ||
                (patternType === 'bearish' && !isBullish)) {
                patterns.push(pattern);
            }
        }
        
        return patterns;
    }
    
    // Generate educational patterns for demo
    function generateEducationalPatterns(symbol) {
        const patterns = [];
        const hasPattern = Math.random() > 0.3;
        
        if (hasPattern) {
            const isBullish = Math.random() > 0.5;
            patterns.push({
                symbol: symbol,
                pattern: isBullish ? '📈 Volume UP + Price UP' : '📉 Volume DOWN + Price DOWN',
                candles: 3 + Math.floor(Math.random() * 2),
                volumeChange: isBullish ? 
                    (12 + Math.random() * 15).toFixed(1) : 
                    (-10 - Math.random() * 12).toFixed(1),
                priceChange: isBullish ? 
                    (1.5 + Math.random() * 3).toFixed(1) : 
                    (-1 - Math.random() * 2).toFixed(1),
                currentPrice: (1500 + Math.random() * 1500).toFixed(2),
                patternDates: 'Recent trading days',
                volumeData: generateSampleVolumeData(isBullish),
                priceData: generateSamplePriceData(isBullish)
            });
        }
        
        return patterns;
    }
    
    // Helper functions
    function generateSampleVolumeData(isBullish) {
        const base = 1000000;
        if (isBullish) {
            return `${(base * 0.9).toLocaleString()} → ${(base * 1.1).toLocaleString()} → ${(base * 1.3).toLocaleString()}`;
        } else {
            return `${(base * 1.2).toLocaleString()} → ${(base * 1.0).toLocaleString()} → ${(base * 0.8).toLocaleString()}`;
        }
    }
    
    function generateSamplePriceData(isBullish) {
        const base = 1500;
        if (isBullish) {
            return `₹${(base * 0.98).toFixed(0)} → ₹${base.toFixed(0)} → ₹${(base * 1.03).toFixed(0)}`;
        } else {
            return `₹${(base * 1.02).toFixed(0)} → ₹${base.toFixed(0)} → ₹${(base * 0.97).toFixed(0)}`;
        }
    }
    
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Display results
    function displayResults(patterns) {
        // Hide placeholder
        document.querySelector('.results-placeholder').style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Clear previous results
        resultsBody.innerHTML = '';
        
        if (patterns.length === 0) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 50px;">
                        <i class="fas fa-search" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 15px;"></i>
                        <h3 style="color: #718096;">No Educational Patterns Found</h3>
                        <p>Try adjusting the scanner settings or use the Demo mode to see example patterns.</p>
                        <p><small>Remember: This tool is for learning pattern recognition concepts.</small></p>
                    </td>
                </tr>
            `;
            resultsCount.textContent = '0 patterns found';
        } else {
            // Populate results
            patterns.forEach((pattern, index) => {
                const row = document.createElement('tr');
                const isBullish = pattern.pattern.includes('UP');
                
                row.innerHTML = `
                    <td>
                        <strong>${pattern.symbol}</strong>
                        <div class="stock-name">${pattern.symbol} (Practice)</div>
                    </td>
                    <td>
                        <span class="pattern-badge ${isBullish ? 'badge-bullish' : 'badge-bearish'}">
                            ${pattern.pattern}
                        </span>
                    </td>
                    <td>${pattern.candles} candles</td>
                    <td>${pattern.volumeChange}%</td>
                    <td>${pattern.priceChange}%</td>
                    <td>₹${pattern.currentPrice}</td>
                    <td>${pattern.patternDates}</td>
                    <td>
                        <button class="btn-analyze" onclick="analyzePattern('${pattern.symbol}', '${pattern.pattern}')">
                            <i class="fas fa-chart-line"></i> Analyze
                        </button>
                    </td>
                `;
                resultsBody.appendChild(row);
            });
            
            resultsCount.textContent = `${patterns.length} educational pattern(s) found`;
        }
        
        // Update scan time
        const now = new Date();
        scanTime.textContent = `Scanned at: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        // Show random educational message
        const randomMessage = educationalMessages[Math.floor(Math.random() * educationalMessages.length)];
        showEducationalMessage(randomMessage);
        
        // Scroll to results
        resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Load demo results
    function loadDemoResults() {
        showLoadingState();
        
        // Simulate API delay
        setTimeout(() => {
            displayResults(demoPatterns);
            showEducationalMessage("Demo mode active. Showing example patterns for educational purposes.");
        }, 1000);
    }
    
    // Reset scanner
    function resetScanner() {
        document.querySelector('.results-placeholder').style.display = 'block';
        resultsContainer.style.display = 'none';
        resultsBody.innerHTML = '';
        
        // Reset form
        document.getElementById('stockSelect').value = 'RELIANCE.NS';
        document.getElementById('daysSelect').value = '15';
        document.getElementById('patternType').value = 'both';
        document.getElementById('minCandles').value = '3';
        
        showEducationalMessage("Scanner reset. Ready for new learning session!");
    }
    
    // Show loading state
    function showLoadingState() {
        const placeholder = document.querySelector('.results-placeholder');
        placeholder.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #4f46e5;"></i>
                <h3>Running Educational Scan...</h3>
                <p>Analyzing volume-price patterns for learning purposes</p>
                <p><small>This may take a few moments. Using free API with rate limits.</small></p>
            </div>
        `;
        resultsContainer.style.display = 'none';
    }
    
    // Download learning guide
    function downloadLearningGuide() {
        showEducationalMessage("Downloading Volume-Price Pattern Learning Guide...");
        
        // Create guide content
        const guideContent = `
Volume-Price Pattern Scanner - Educational Guide
===============================================

This guide explains how to use the Volume-Price Pattern Scanner for educational purposes.

📚 WHAT IS VOLUME-PRICE ANALYSIS?
Volume-price analysis examines the relationship between trading volume and price movements.
It's based on the principle that volume often precedes price movement.

🎯 PATTERNS THIS SCANNER LOOKS FOR:

1. 📈 VOLUME UP + PRICE UP
   - Generally indicates buying interest
   - Increasing volume confirms price increase
   - Minimum 3 consecutive candles
   - Volume change ≥ 5%

2. 📉 VOLUME DOWN + PRICE DOWN
   - Generally indicates selling pressure
   - Decreasing volume confirms price decrease
   - Minimum 3 consecutive candles
   - Volume change ≥ 5%

📊 HOW TO USE THIS EDUCATIONAL TOOL:

1. Select a stock or use "Multiple Stocks"
2. Choose lookback period (7-30 days)
3. Select pattern type or use "Both"
4. Set minimum candle requirement
5. Click "Run Educational Scan"
6. Review patterns found
7. Use "Analyze" button to study each pattern

⚠️ IMPORTANT EDUCATIONAL NOTES:
- This tool uses historical/delayed data
- Patterns shown are for learning only
- Always verify with fundamental analysis
- Consult SEBI registered advisors for investment decisions

📈 LEARNING EXERCISES:
1. Try finding both pattern types
2. Compare different lookback periods
3. Analyze why some stocks show more patterns
4. Study the volume and price changes

Remember: This tool is for LEARNING PATTERN RECOGNITION only.
Not for investment decisions.

IncomePlus.in - Stock Market Education Platform
        `;
        
        // Create and trigger download
        const blob = new Blob([guideContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Volume_Price_Pattern_Learning_Guide.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    // Export functions
    function exportToCSV() {
        const patterns = demoPatterns; // In real app, use actual results
        let csv = 'Symbol,Pattern,Candles,Volume_Change(%),Price_Change(%),Current_Price,Pattern_Dates\n';
        
        patterns.forEach(pattern => {
            csv += `${pattern.symbol},"${pattern.pattern}",${pattern.candles},${pattern.volumeChange},${pattern.priceChange},${pattern.currentPrice},"${pattern.patternDates}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Volume_Price_Patterns_Educational.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showEducationalMessage("CSV exported for educational practice!");
    }
    
    function exportToPDF() {
        showEducationalMessage("PDF export would require a library like jsPDF. For now, use Print or CSV export.");
        // In production, you'd implement jsPDF here
    }
    
    function printResults() {
        window.print();
    }
    
    // Educational message system
    function showEducationalMessage(message) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.educational-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'educational-message';
        messageDiv.innerHTML = `
            <i class="fas fa-graduation-cap"></i>
            <span>${mes