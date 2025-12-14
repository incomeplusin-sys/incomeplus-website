// Generate sample scan results for testing
class SampleDataGenerator {
    static generateSampleResults(count = 50) {
        const scanners = [
            'Volume-Price Scanner',
            'Breakout Scanner', 
            'Momentum Scanner',
            'Support-Resistance Scanner',
            'Moving Average Scanner',
            'RSI Divergence Scanner',
            'Volume Spike Scanner',
            'Pattern Recognition Scanner',
            'Gap Scanner',
            'Option Chain Scanner'
        ];
        
        const stocks = [
            {symbol: 'RELIANCE', name: 'Reliance Industries'},
            {symbol: 'TCS', name: 'Tata Consultancy Services'},
            {symbol: 'HDFCBANK', name: 'HDFC Bank'},
            {symbol: 'INFY', name: 'Infosys'},
            {symbol: 'ICICIBANK', name: 'ICICI Bank'},
            {symbol: 'BHARTIARTL', name: 'Bharti Airtel'},
            {symbol: 'ITC', name: 'ITC Limited'},
            {symbol: 'SBIN', name: 'State Bank of India'},
            {symbol: 'WIPRO', name: 'Wipro'},
            {symbol: 'AXISBANK', name: 'Axis Bank'},
            {symbol: 'LT', name: 'Larsen & Toubro'},
            {symbol: 'HINDUNILVR', name: 'Hindustan Unilever'},
            {symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank'},
            {symbol: 'BAJFINANCE', name: 'Bajaj Finance'},
            {symbol: 'ASIANPAINT', name: 'Asian Paints'},
            {symbol: 'MARUTI', name: 'Maruti Suzuki'},
            {symbol: 'TITAN', name: 'Titan Company'},
            {symbol: 'SUNPHARMA', name: 'Sun Pharma'},
            {symbol: 'BAJAJFINSV', name: 'Bajaj Finserv'},
            {symbol: 'TATAMOTORS', name: 'Tata Motors'}
        ];
        
        const signals = [
            'Strong Bullish',
            'Bullish',
            'Neutral Bullish',
            'Neutral',
            'Neutral Bearish',
            'Bearish',
            'Strong Bearish'
        ];
        
        const sampleResults = [];
        
        // Generate sample results
        for (let i = 0; i < count; i++) {
            const stock = stocks[Math.floor(Math.random() * stocks.length)];
            const scanner = scanners[Math.floor(Math.random() * scanners.length)];
            const signal = signals[Math.floor(Math.random() * signals.length)];
            
            const currentPrice = 100 + Math.random() * 9000;
            const priceChange = (Math.random() * 20 - 10).toFixed(2); // -10% to +10%
            const confidence = Math.floor(Math.random() * 30 + 70); // 70-100%
            
            // Generate a random date within last 90 days
            const savedAt = new Date();
            savedAt.setDate(savedAt.getDate() - Math.floor(Math.random() * 90));
            savedAt.setHours(Math.floor(Math.random() * 24));
            savedAt.setMinutes(Math.floor(Math.random() * 60));
            
            sampleResults.push({
                id: `result_${Date.now()}_${i}`,
                symbol: stock.symbol,
                name: stock.name,
                scannerType: scanner,
                scannerId: scanner.toLowerCase().replace(/\s+/g, '-'),
                signal: signal,
                confidence: confidence,
                currentPrice: parseFloat(currentPrice.toFixed(2)),
                priceChange: parseFloat(priceChange),
                savedAt: savedAt.toISOString(),
                notes: '',
                isSaved: true,
                timestamp: savedAt.getTime()
            });
        }
        
        return sampleResults;
    }
    
    static initializeSampleData() {
        // Check if sample data already exists
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        if (savedResults.length === 0) {
            // Generate sample data if none exists
            const sampleResults = this.generateSampleResults(25);
            localStorage.setItem('savedResults', JSON.stringify(sampleResults));
            
            console.log('Sample results generated successfully');
            return sampleResults;
        }
        
        return savedResults;
    }
    
    static clearAllData() {
        localStorage.removeItem('savedResults');
        console.log('All results cleared');
    }
    
    static addNewResult(result) {
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        savedResults.unshift({
            ...result,
            id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            savedAt: new Date().toISOString(),
            timestamp: Date.now()
        });
        
        localStorage.setItem('savedResults', JSON.stringify(savedResults));
        return savedResults;
    }
}

// Initialize sample data when page loads
document.addEventListener('DOMContentLoaded', function() {
    SampleDataGenerator.initializeSampleData();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SampleDataGenerator;
} else {
    window.SampleDataGenerator = SampleDataGenerator;
}
