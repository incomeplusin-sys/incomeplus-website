// Breakout Scanner Specific Logic
class BreakoutScanner {
    constructor() {
        this.scannerType = 'Breakout';
        this.init();
    }
    
    init() {
        this.setupBreakoutSpecificEvents();
        this.loadBreakoutPresets();
    }
    
    setupBreakoutSpecificEvents() {
        // Pattern type selection
        const patternSelect = document.getElementById('patternType');
        if (patternSelect) {
            patternSelect.addEventListener('change', (e) => {
                this.updatePatternVisualization();
            });
        }
        
        // Backtest button
        const backtestBtn = document.getElementById('backtest');
        if (backtestBtn) {
            backtestBtn.addEventListener('click', () => this.runBacktest());
        }
    }
    
    updatePatternVisualization() {
        const selectedPatterns = Array.from(document.querySelectorAll('#patternType option:checked')).map(opt => opt.value);
        // Update chart visualization based on selected patterns
        console.log('Selected patterns:', selectedPatterns);
    }
    
    async runBacktest() {
        const params = this.getBreakoutParameters();
        
        // Show loading
        const btn = document.getElementById('backtest');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backtesting...';
        btn.disabled = true;
        
        try {
            // Simulate backtest
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Show backtest results
            this.showBacktestResults({
                totalTrades: 124,
                winningTrades: 102,
                losingTrades: 22,
                winRate: '82.3%',
                averageGain: '5.2%',
                averageLoss: '2.1%',
                profitFactor: 2.4,
                maxDrawdown: '8.5%',
                sharpeRatio: 1.8
            });
            
        } catch (error) {
            console.error('Backtest error:', error);
            alert('Backtest failed: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    getBreakoutParameters() {
        return {
            timeframe: document.getElementById('timeframe').value,
            consolidationPeriod: document.getElementById('consolidationPeriod').value,
            breakoutThreshold: document.getElementById('breakoutThreshold').value,
            volumeMultiplier: document.getElementById('volumeMultiplier').value,
            patternType: Array.from(document.querySelectorAll('#patternType option:checked')).map(opt => opt.value),
            direction: document.getElementById('direction').value
        };
    }
    
    showBacktestResults(results) {
        const modal = document.createElement('div');
        modal.className = 'backtest-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-line"></i> Backtest Results</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="results-grid">
                        <div class="result-item">
                            <div class="result-label">Win Rate</div>
                            <div class="result-value success">${results.winRate}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Avg. Gain</div>
                            <div class="result-value success">${results.averageGain}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Avg. Loss</div>
                            <div class="result-value danger">${results.averageLoss}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Profit Factor</div>
                            <div class="result-value">${results.profitFactor}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Total Trades</div>
                            <div class="result-value">${results.totalTrades}</div>
                        </div>
                        <div class="result-item">
                            <div class="result-label">Sharpe Ratio</div>
                            <div class="result-value">${results.sharpeRatio}</div>
                        </div>
                    </div>
                    
                    <div class="backtest-chart">
                        <canvas id="backtestChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="backtest-notes">
                        <p><strong>Note:</strong> Backtest results are based on historical data and may not reflect future performance.</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="exportBacktestResults()">
                        <i class="fas fa-download"></i> Export Results
                    </button>
                    <button class="btn-secondary modal-close-btn">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles
        if (!document.querySelector('#backtest-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'backtest-modal-styles';
            style.textContent = `
                .backtest-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                
                .modal-content {
                    background: white;
                    width: 90%;
                    max-width: 800px;
                    border-radius: 15px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 30px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .modal-header h3 {
                    margin: 0;
                    color: #2d3748;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #718096;
                    cursor: pointer;
                }
                
                .modal-body {
                    padding: 30px;
                }
                
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .result-item {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 10px;
                    text-align: center;
                }
                
                .result-label {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin-bottom: 5px;
                }
                
                .result-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                
                .result-value.success {
                    color: #10b981;
                }
                
                .result-value.danger {
                    color: #ef4444;
                }
                
                .backtest-chart {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                }
                
                .backtest-notes {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 8px;
                    color: #856404;
                    font-size: 0.9rem;
                }
                
                .modal-footer {
                    padding: 20px 30px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                }
                
                .modal-close-btn {
                    background: #f1f5f9;
                    color: #64748b;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Close modal handlers
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.breakoutScanner = new BreakoutScanner();
});

// Global function for exporting backtest results
function exportBacktestResults() {
    alert('Exporting backtest results...');
    // Implementation for exporting results
}
