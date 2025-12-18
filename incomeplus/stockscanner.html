<!DOCTYPE html>
<html lang="en-IN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Stock Volume Scanner | IncomePlus | Real-time Market Analysis</title>
    <meta name="description" content="Free live Indian stock volume pattern scanner. Real-time V and U pattern detection for NSE & BSE stocks using Yahoo Finance API.">
    <meta name="keywords" content="live stock scanner, volume pattern scanner, real-time market analysis, V pattern stocks, U pattern stocks, Indian stocks scanner">
    
    <link rel="canonical" href="https://incomeplus.in/stockscanner.html">
    
    <!-- SEO Meta Tags -->
    <meta property="og:title" content="Live Stock Volume Scanner - IncomePlus">
    <meta property="og:description" content="Real-time volume pattern detection for Indian stocks">
    <meta property="og:image" content="https://incomeplus.in/images/og-image.jpg">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="icon" href="images/favicon.ico">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4">
            <div class="flex justify-between items-center h-16">
                <a href="/" class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <i class="fas fa-shield-alt text-white text-xl"></i>
                    </div>
                    <span class="text-2xl font-bold text-gray-900">IncomePlus</span>
                </a>
                
                <div class="hidden md:flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-blue-600">Home</a>
                    <a href="scanner.html" class="text-gray-700 hover:text-blue-600">Security Scanner</a>
                    <a href="stockscanner.html" class="text-blue-600 font-medium">Stock Scanner</a>
                    <a href="pricing.html" class="text-gray-700 hover:text-blue-600">Pricing</a>
                    <a href="blog/" class="text-gray-700 hover:text-blue-600">Blog</a>
                </div>
                
                <button id="mobileMenuBtn" class="md:hidden text-gray-700">
                    <i class="fas fa-bars text-2xl"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-6">Live Stock Volume Scanner</h1>
            <p class="text-xl mb-8 max-w-3xl mx-auto">Real-time V & U pattern detection for Indian stocks using live Yahoo Finance data</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                <div class="bg-white/20 p-4 rounded-lg">
                    <i class="fas fa-bolt text-3xl mb-3"></i>
                    <h3 class="font-bold text-lg">Live Data</h3>
                    <p class="text-sm opacity-90">Real-time prices & volumes</p>
                </div>
                <div class="bg-white/20 p-4 rounded-lg">
                    <i class="fas fa-chart-line text-3xl mb-3"></i>
                    <h3 class="font-bold text-lg">Pattern Detection</h3>
                    <p class="text-sm opacity-90">V & U volume patterns</p>
                </div>
                <div class="bg-white/20 p-4 rounded-lg">
                    <i class="fas fa-rupee-sign text-3xl mb-3"></i>
                    <h3 class="font-bold text-lg">Indian Stocks</h3>
                    <p class="text-sm opacity-90">NSE & BSE listed companies</p>
                </div>
            </div>
            
            <button onclick="startLiveScan()" class="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 shadow-lg mb-4">
                <i class="fas fa-play mr-2"></i>Start Live Stock Scan
            </button>
            <p class="text-purple-200 text-sm">
                <i class="fas fa-info-circle mr-2"></i>Scanning 100+ Indian stocks with live market data
            </p>
        </div>
    </section>

    <!-- Scanner Interface -->
    <section class="py-12">
        <div class="container mx-auto px-4 max-w-6xl">
            <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <!-- Controls -->
                <div class="mb-8">
                    <h2 class="text-2xl font-bold mb-6 flex items-center">
                        <i class="fas fa-sliders-h mr-2 text-blue-600"></i>Scanner Controls
                    </h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-gray-700 mb-3 font-medium">Pattern Types</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" id="scanVPattern" checked class="mr-3 h-5 w-5 text-blue-600">
                                    <span class="font-medium">V Pattern (5-candle)</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" id="scanUPattern" checked class="mr-3 h-5 w-5 text-blue-600">
                                    <span class="font-medium">U Pattern (6-candle)</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-gray-700 mb-3 font-medium">Scan Options</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" id="filterPositive" class="mr-3 h-5 w-5 text-blue-600">
                                    <span>Positive Price Change Only</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" id="limitResults" class="mr-3 h-5 w-5 text-blue-600">
                                    <span>Limit to 50 Stocks (Faster)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-4">
                        <button onclick="startLiveScan()" id="startBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center">
                            <i class="fas fa-play mr-2"></i>Start Live Scan
                        </button>
                        <button onclick="stopScan()" id="stopBtn" class="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-bold hover:bg-gray-50 hidden">
                            <i class="fas fa-stop mr-2"></i>Stop Scan
                        </button>
                        <button onclick="exportResults()" id="exportBtn" class="border border-green-600 text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 hidden">
                            <i class="fas fa-file-excel mr-2"></i>Export Results
                        </button>
                    </div>
                </div>
                
                <!-- Progress -->
                <div id="progressSection" class="hidden mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold flex items-center">
                            <i class="fas fa-sync-alt fa-spin mr-2 text-blue-600"></i>
                            <span id="statusText">Starting scan...</span>
                        </h3>
                        <span id="progressPercent" class="font-bold">0%</span>
                    </div>
                    
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div id="progressBar" class="bg-blue-600 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    
                    <div class="mt-4 text-center">
                        <p id="currentStock" class="text-gray-600"></p>
                        <p id="scannedCount" class="text-sm text-gray-500 mt-1"></p>
                    </div>
                </div>
                
                <!-- Results -->
                <div id="resultsSection" class="hidden">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">
                            <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
                            Scan Results
                        </h2>
                        <div class="text-sm text-gray-600">
                            <span id="resultCount">0</span> patterns found
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pattern</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody id="resultsTable" class="bg-white divide-y divide-gray-200">
                                <!-- Results will load here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="noResults" class="hidden text-center py-12">
                        <i class="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl font-bold text-gray-600 mb-2">No Patterns Found</h3>
                        <p class="text-gray-500">Try adjusting your scan settings or check back later.</p>
                    </div>
                </div>
                
                <!-- Charts -->
                <div id="chartsSection" class="hidden mt-12">
                    <h2 class="text-2xl font-bold mb-6">Pattern Visualization</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <h3 class="text-lg font-bold mb-4 text-green-700">V Pattern (Bullish Reversal)</h3>
                            <div class="h-64">
                                <canvas id="vPatternChart"></canvas>
                            </div>
                        </div>
                        <div class="bg-gray-50 p-6 rounded-xl">
                            <h3 class="text-lg font-bold mb-4 text-orange-700">U Pattern (Consolidation)</h3>
                            <div class="h-64">
                                <canvas id="uPatternChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Information -->
                <div class="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 class="text-lg font-bold mb-3 text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>How It Works
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-bold mb-2 text-blue-700">Live Data Source:</h4>
                            <ul class="space-y-2 text-blue-600">
                                <li><i class="fas fa-check mr-2"></i>Real-time Yahoo Finance API</li>
                                <li><i class="fas fa-check mr-2"></i>3-month historical data</li>
                                <li><i class="fas fa-check mr-2"></i>Daily volume & price analysis</li>
                                <li><i class="fas fa-check mr-2"></i>100+ Indian stocks scanned</li>
                            </ul>
                        </div>
                        <div>
                            <h4 class="font-bold mb-2 text-blue-700">Pattern Detection:</h4>
                            <ul class="space-y-2 text-blue-600">
                                <li><i class="fas fa-chart-line mr-2"></i>V Pattern: 5-candle volume reversal</li>
                                <li><i class="fas fa-chart-area mr-2"></i>U Pattern: 6-candle consolidation</li>
                                <li><i class="fas fa-bolt mr-2"></i>Real-time pattern identification</li>
                                <li><i class="fas fa-filter mr-2"></i>Customizable filters</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="py-12 bg-gray-100">
        <div class="container mx-auto px-4">
            <h2 class="text-3xl font-bold text-center mb-10">Live Market Scanner Features</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="text-center">
                    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-database text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Real-time Data</h3>
                    <p class="text-gray-600">Live stock prices, volumes, and market data from Yahoo Finance API</p>
                </div>
                
                <div class="text-center">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-chart-pie text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Pattern Detection</h3>
                    <p class="text-gray-600">Your Python scanner logic converted to JavaScript for browser execution</p>
                </div>
                
                <div class="text-center">
                    <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-mobile-alt text-purple-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">No Backend Needed</h3>
                    <p class="text-gray-600">Runs entirely in browser, works on GitHub Pages with no server costs</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <a href="/" class="flex items-center space-x-3 mb-6">
                        <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-shield-alt text-white text-xl"></i>
                        </div>
                        <span class="text-2xl font-bold">IncomePlus</span>
                    </a>
                    <p class="text-gray-400">Live market analysis tools for Indian investors</p>
                </div>
                
                <div>
                    <h3 class="text-lg font-bold mb-4">Tools</h3>
                    <ul class="space-y-2">
                        <li><a href="scanner.html" class="text-gray-400 hover:text-white">Security Scanner</a></li>
                        <li><a href="stockscanner.html" class="text-gray-400 hover:text-white">Stock Scanner</a></li>
                        <li><a href="pricing.html" class="text-gray-400 hover:text-white">Pricing</a></li>
                        <li><a href="blog/" class="text-gray-400 hover:text-white">Market Blog</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="text-lg font-bold mb-4">Legal</h3>
                    <ul class="space-y-2">
                        <li><a href="legal/terms-of-service.html" class="text-gray-400 hover:text-white">Terms</a></li>
                        <li><a href="legal/privacy-policy.html" class="text-gray-400 hover:text-white">Privacy</a></li>
                        <li><a href="legal/disclaimer.html" class="text-gray-400 hover:text-white">Disclaimer</a></li>
                        <li><a href="#" class="text-gray-400 hover:text-white">Contact</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="text-lg font-bold mb-4">Data Sources</h3>
                    <div class="space-y-2 text-sm text-gray-400">
                        <p><i class="fas fa-check-circle text-green-500 mr-2"></i>Yahoo Finance API</p>
                        <p><i class="fas fa-check-circle text-green-500 mr-2"></i>Real-time NSE/BSE Data</p>
                        <p><i class="fas fa-check-circle text-green-500 mr-2"></i>Historical Analysis</p>
                        <p><i class="fas fa-check-circle text-green-500 mr-2"></i>Volume Pattern Detection</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 IncomePlus. All rights reserved.</p>
                <p class="mt-2">Stock analysis for educational purposes. Not financial advice.</p>
                <p class="mt-2 text-sm">Live data from Yahoo Finance. Mumbai, India.</p>
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="js/main.js"></script>
    <script src="js/stockscanner.js"></script>
</body>
</html>
