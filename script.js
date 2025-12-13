// Stock Screener Educational Tool
document.addEventListener('DOMContentLoaded', function() {
    // Sample educational data for practice
    const sampleStocks = [
        {
            name: "Reliance Industries (Practice)",
            ticker: "RELIANCE",
            sector: "Energy",
            marketCap: "Large Cap",
            peRatio: 22.5,
            dividend: 0.9,
            risk: "Medium"
        },
        {
            name: "TCS (Practice)",
            ticker: "TCS",
            sector: "IT",
            marketCap: "Large Cap",
            peRatio: 30.2,
            dividend: 1.2,
            risk: "Low"
        },
        {
            name: "HDFC Bank (Practice)",
            ticker: "HDFCBANK",
            sector: "Banking",
            marketCap: "Large Cap",
            peRatio: 18.7,
            dividend: 1.5,
            risk: "Medium"
        },
        {
            name: "Infosys (Practice)",
            ticker: "INFY",
            sector: "IT",
            marketCap: "Large Cap",
            peRatio: 25.8,
            dividend: 2.1,
            risk: "Low"
        },
        {
            name: "ITC (Practice)",
            ticker: "ITC",
            sector: "FMCG",
            marketCap: "Large Cap",
            peRatio: 20.3,
            dividend: 4.5,
            risk: "Low"
        },
        {
            name: "Asian Paints (Practice)",
            ticker: "ASIANPAINT",
            sector: "Manufacturing",
            marketCap: "Large Cap",
            peRatio: 65.4,
            dividend: 0.8,
            risk: "High"
        },
        {
            name: "Bajaj Finance (Practice)",
            ticker: "BAJFINANCE",
            sector: "Financial Services",
            marketCap: "Large Cap",
            peRatio: 35.6,
            dividend: 0.5,
            risk: "High"
        },
        {
            name: "Sun Pharma (Practice)",
            ticker: "SUNPHARMA",
            sector: "Pharma",
            marketCap: "Large Cap",
            peRatio: 28.9,
            dividend: 1.1,
            risk: "Medium"
        },
        {
            name: "Maruti Suzuki (Practice)",
            ticker: "MARUTI",
            sector: "Automobile",
            marketCap: "Large Cap",
            peRatio: 32.1,
            dividend: 0.7,
            risk: "Medium"
        },
        {
            name: "HUL (Practice)",
            ticker: "HINDUNILVR",
            sector: "FMCG",
            marketCap: "Large Cap",
            peRatio: 58.7,
            dividend: 1.8,
            risk: "Low"
        }
    ];

    const screenerResults = document.getElementById('screenerResults');
    const practiceFilterBtn = document.getElementById('practiceFilter');
    const resetScreenerBtn = document.getElementById('resetScreener');
    const learnMoreBtn = document.getElementById('learnMore');

    // Function to render stock results
    function renderStocks(stocks) {
        if (stocks.length === 0) {
            screenerResults.innerHTML = `
                <tr class="no-results">
                    <td colspan="6">
                        <i class="fas fa-search"></i>
                        <p>No matching practice stocks found</p>
                        <small>Try different filter combinations for learning</small>
                    </td>
                </tr>
            `;
            return;
        }

        screenerResults.innerHTML = stocks.map(stock => `
            <tr>
                <td>
                    <div class="stock-ticker">${stock.ticker}</div>
                    <div class="stock-name">${stock.name}</div>
                </td>
                <td>${stock.sector}</td>
                <td>${stock.marketCap}</td>
                <td>${stock.peRatio}</td>
                <td>${stock.dividend}%</td>
                <td>
                    <button class="btn-analyze" onclick="analyzeStock('${stock.ticker}')">
                        <i class="fas fa-chart-line"></i> Practice Analysis
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Initial render
    renderStocks(sampleStocks);

    // Practice Filtering button
    practiceFilterBtn.addEventListener('click', function() {
        const marketCap = document.getElementById('market-cap').value;
        const peRatio = document.getElementById('pe-ratio').value;
        const sector = document.getElementById('sector').value;
        const dividend = document.getElementById('dividend').value;

        let filteredStocks = [...sampleStocks];

        // Educational filtering logic
        if (marketCap) {
            filteredStocks = filteredStocks.filter(stock => 
                marketCap === 'large' ? stock.marketCap === 'Large Cap' :
                marketCap === 'mid' ? stock.marketCap === 'Mid Cap' :
                stock.marketCap === 'Small Cap'
            );
        }

        if (peRatio) {
            filteredStocks = filteredStocks.filter(stock => 
                peRatio === 'low' ? stock.peRatio < 15 :
                peRatio === 'medium' ? stock.peRatio >= 15 && stock.peRatio <= 25 :
                stock.peRatio > 25
            );
        }

        if (sector) {
            filteredStocks = filteredStocks.filter(stock => 
                stock.sector.toLowerCase().includes(sector)
            );
        }

        if (dividend) {
            filteredStocks = filteredStocks.filter(stock => 
                dividend === 'high' ? stock.dividend > 3 :
                dividend === 'medium' ? stock.dividend >= 1 && stock.dividend <= 3 :
                stock.dividend < 1
            );
        }

        renderStocks(filteredStocks);
        
        // Educational feedback
        showEducationalMessage(`Found ${filteredStocks.length} practice stocks for learning. Remember: This is educational practice only.`);
    });

    // Reset button
    resetScreenerBtn.addEventListener('click', function() {
        document.getElementById('market-cap').value = '';
        document.getElementById('pe-ratio').value = '';
        document.getElementById('sector').value = '';
        document.getElementById('dividend').value = '';
        
        renderStocks(sampleStocks);
        showEducationalMessage('Filters reset. Ready for new practice session!');
    });

    // Learn More button
    learnMoreBtn.addEventListener('click', function() {
        showEducationalMessage('Stock screeners help investors filter stocks based on parameters. This tool is for learning how they work. Always consult professionals for actual investment decisions.');
    });

    // Educational message function
    function showEducationalMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'educational-message';
        messageDiv.innerHTML = `
            <i class="fas fa-graduation-cap"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        // Add styles if not already added
        if (!document.querySelector('#educational-styles')) {
            const style = document.createElement('style');
            style.id = 'educational-styles';
            style.textContent = `
                .educational-message {
                    background: #e0e7ff;
                    color: #4f46e5;
                    padding: 15px 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: slideIn 0.3s ease;
                }
                .educational-message i {
                    font-size: 1.2rem;
                }
                .educational-message button {
                    background: none;
                    border: none;
                    color: #4f46e5;
                    font-size: 1.5rem;
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
        
        const screenerControls = document.querySelector('.screener-controls');
        screenerControls.parentNode.insertBefore(messageDiv, screenerControls.nextSibling);
        
        // Auto remove after 8 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 8000);
    }

    // Global function for analysis button
    window.analyzeStock = function(ticker) {
        showEducationalMessage(`Practice analyzing ${ticker}: Check P/E ratio, debt levels, growth trends. Remember: This is for learning only, not investment advice.`);
    };
});