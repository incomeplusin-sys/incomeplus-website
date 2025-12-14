// Results History Management
class ResultsManager {
    constructor() {
        this.currentPage = 1;
        this.resultsPerPage = 10;
        this.totalResults = 0;
        this.filteredResults = [];
        this.selectedResults = new Set();
        this.init();
    }
    
    init() {
        this.loadResults();
        this.setupEventListeners();
        this.updateStats();
    }
    
    async loadResults() {
        const tbody = document.getElementById('resultsBody');
        if (!tbody) return;
        
        // Show loading state
        this.showLoading(true);
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Load from localStorage
            const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
            
            // Apply filters
            this.filteredResults = this.applyFilters(savedResults);
            this.totalResults = this.filteredResults.length;
            
            // Update pagination
            this.updatePagination();
            
            // Display current page
            this.displayCurrentPage();
            
            // Update select all checkbox
            this.updateSelectAllState();
            
        } catch (error) {
            console.error('Error loading results:', error);
            this.showError('Failed to load results');
        } finally {
            this.showLoading(false);
        }
    }
    
    applyFilters(results) {
        const dateRange = document.getElementById('dateRange').value;
        const scannerFilter = document.getElementById('scannerFilter').value;
        const stockFilter = document.getElementById('stockFilter').value.trim().toLowerCase();
        
        let filtered = [...results];
        
        // Apply date filter
        if (dateRange !== 'all') {
            const now = new Date();
            let cutoffDate = new Date(now);
            
            switch(dateRange) {
                case 'today':
                    cutoffDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    cutoffDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoffDate.setMonth(now.getMonth() - 1);
                    break;
                case 'quarter':
                    cutoffDate.setMonth(now.getMonth() - 3);
                    break;
                case 'custom':
                    // Handle custom date range here
                    break;
            }
            
            filtered = filtered.filter(result => new Date(result.savedAt) >= cutoffDate);
        }
        
        // Apply scanner filter
        if (scannerFilter !== 'all') {
            filtered = filtered.filter(result => {
                const resultScannerId = result.scannerId || 
                    result.scannerType.toLowerCase().replace(/\s+/g, '-');
                return resultScannerId === scannerFilter;
            });
        }
        
        // Apply stock filter
        if (stockFilter) {
            filtered = filtered.filter(result => 
                result.symbol.toLowerCase().includes(stockFilter) || 
                (result.name && result.name.toLowerCase().includes(stockFilter))
            );
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        
        return filtered;
    }
    
    displayCurrentPage() {
        const tbody = document.getElementById('resultsBody');
        if (!tbody) return;
        
        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const pageResults = this.filteredResults.slice(startIndex, endIndex);
        
        if (pageResults.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 60px 20px;">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h4>No results found</h4>
                            <p>Try adjusting your filters or run some scans to see results here.</p>
                            <button onclick="location.href='scanners/volume-price.html'" 
                                    class="btn-primary" 
                                    style="margin-top: 20px; padding: 10px 20px;">
                                <i class="fas fa-search"></i> Run New Scan
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pageResults.map(result => {
            const resultId = result.id || `${result.symbol}_${result.savedAt}`;
            const isSelected = this.selectedResults.has(resultId);
            
            return `
                <tr class="${isSelected ? 'selected-row' : ''}">
                    <td>
                        <input type="checkbox" 
                               class="result-checkbox" 
                               data-id="${resultId}"
                               ${isSelected ? 'checked' : ''}>
                    </td>
                    <td>
                        <div class="date-time">
                            <div class="date">${this.formatDate(result.savedAt)}</div>
                            <div class="time">${this.formatTime(result.savedAt)}</div>
                        </div>
                    </td>
                    <td>
                        <span class="scanner-badge">${result.scannerType}</span>
                    </td>
                    <td>
                        <div class="stock-info">
                            <strong>${result.symbol}</strong>
                            <small>${result.name || result.symbol}</small>
                        </div>
                    </td>
                    <td>
                        <span class="signal-badge ${this.getSignalClass(result.signal)}">
                            ${result.signal}
                        </span>
                    </td>
                    <td>
                        <div class="confidence-meter">
                            <div class="meter-bar">
                                <div class="meter-fill" style="width: ${result.confidence}%"></div>
                            </div>
                            <span class="meter-value">${result.confidence}%</span>
                        </div>
                    </td>
                    <td>
                        <div class="price-info">
                            <div class="price">₹${result.currentPrice?.toFixed(2) || '--'}</div>
                            <div class="change ${result.priceChange >= 0 ? 'positive' : 'negative'}">
                                ${result.priceChange >= 0 ? '+' : ''}${result.priceChange?.toFixed(2) || '0.00'}%
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="performance-indicator ${this.getPerformanceClass(result.confidence)}">
                            ${this.getPerformanceText(result.confidence)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action view-result" 
                                    data-id="${resultId}"
                                    title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-action save-result" 
                                    data-id="${resultId}"
                                    title="Save to Watchlist">
                                <i class="fas fa-bookmark"></i>
                            </button>
                            <button class="btn-action delete-result" 
                                    data-id="${resultId}"
                                    title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Setup event listeners for new elements
        this.setupRowEventListeners();
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
    
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    
    getSignalClass(signal) {
        if (signal.toLowerCase().includes('bullish')) return 'bullish';
        if (signal.toLowerCase().includes('bearish')) return 'bearish';
        return 'neutral';
    }
    
    getPerformanceClass(confidence) {
        if (confidence >= 85) return 'performance-positive';
        if (confidence >= 70) return 'performance-neutral';
        return 'performance-negative';
    }
    
    getPerformanceText(confidence) {
        if (confidence >= 85) return 'High';
        if (confidence >= 70) return 'Medium';
        return 'Low';
    }
    
    showLoading(show) {
        const tbody = document.getElementById('resultsBody');
        if (!tbody) return;
        
        if (show) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 60px 20px;">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Loading results...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    showError(message) {
        const tbody = document.getElementById('resultsBody');
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 60px 20px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                    <h4 style="color: #ef4444; margin-bottom: 10px;">Error</h4>
                    <p>${message}</p>
                    <button onclick="window.resultsManager.loadResults()" 
                            class="btn-secondary" 
                            style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.totalResults / this.resultsPerPage);
        
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages || 1;
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
    }
    
    setupEventListeners() {
        // Apply filters button
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.selectedResults.clear();
                this.loadResults();
                this.updateStats();
                if (window.chartManager) {
                    window.chartManager.updateAllCharts();
                }
            });
        }
        
        // Clear filters button
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                document.getElementById('dateRange').value = 'week';
                document.getElementById('scannerFilter').value = 'all';
                document.getElementById('stockFilter').value = '';
                this.currentPage = 1;
                this.selectedResults.clear();
                this.loadResults();
                this.updateStats();
                if (window.chartManager) {
                    window.chartManager.updateAllCharts();
                }
                this.showNotification('Filters cleared', 'success');
            });
        }
        
        // Enter key in search filter
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter) {
            stockFilter.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.currentPage = 1;
                    this.loadResults();
                    this.updateStats();
                }
            });
        }
        
        // Pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.displayCurrentPage();
                    this.updatePagination();
                    this.scrollToResults();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.totalResults / this.resultsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.displayCurrentPage();
                    this.updatePagination();
                    this.scrollToResults();
                }
            });
        }
        
        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }
        
        // Export all button
        const exportAll = document.getElementById('exportAll');
        if (exportAll) {
            exportAll.addEventListener('click', () => this.exportAllResults());
        }
        
        // Delete selected button
        const deleteSelected = document.getElementById('deleteSelected');
        if (deleteSelected) {
            deleteSelected.addEventListener('click', () => this.deleteSelectedResults());
        }
        
        // Add sample data button
        const addSampleData = document.getElementById('addSampleData');
        if (addSampleData) {
            addSampleData.addEventListener('click', () => this.addSampleData());
        }
        
        // Chart refresh button
        const refreshChartBtn = document.getElementById('refreshChart');
        if (refreshChartBtn) {
            refreshChartBtn.addEventListener('click', () => {
                if (window.chartManager) {
                    window.chartManager.updateAllCharts();
                    this.showNotification('Charts refreshed', 'success');
                }
            });
        }
        
        // Chart download button
        const downloadChartBtn = document.getElementById('downloadChart');
        if (downloadChartBtn) {
            downloadChartBtn.addEventListener('click', () => {
                const chartCanvas = document.getElementById('performanceChart');
                if (chartCanvas && chartCanvas.tagName === 'CANVAS') {
                    const link = document.createElement('a');
                    link.download = 'performance-chart.png';
                    link.href = chartCanvas.toDataURL('image/png');
                    link.click();
                    this.showNotification('Chart downloaded', 'success');
                } else {
                    this.showNotification('No chart available to download', 'warning');
                }
            });
        }
    }
    
    setupRowEventListeners() {
        // Checkbox change events
        const checkboxes = document.querySelectorAll('.result-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const resultId = e.target.getAttribute('data-id');
                const row = e.target.closest('tr');
                
                if (e.target.checked) {
                    this.selectedResults.add(resultId);
                    row.classList.add('selected-row');
                } else {
                    this.selectedResults.delete(resultId);
                    row.classList.remove('selected-row');
                }
                
                this.updateSelectAllState();
            });
        });
        
        // View result buttons
        document.querySelectorAll('.view-result').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resultId = e.target.closest('button').getAttribute('data-id');
                this.viewResultDetails(resultId);
            });
        });
        
        // Save result buttons
        document.querySelectorAll('.save-result').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resultId = e.target.closest('button').getAttribute('data-id');
                this.saveToWatchlist(resultId);
            });
        });
        
        // Delete result buttons
        document.querySelectorAll('.delete-result').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resultId = e.target.closest('button').getAttribute('data-id');
                this.deleteSingleResult(resultId);
            });
        });
        
        // Row click events (for better UX)
        document.querySelectorAll('#resultsBody tr').forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons or checkboxes
                if (e.target.tagName === 'INPUT' || 
                    e.target.tagName === 'BUTTON' || 
                    e.target.closest('button') || 
                    e.target.closest('.action-buttons')) {
                    return;
                }
                
                const checkbox = row.querySelector('.result-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });
    }
    
    toggleSelectAll(select) {
        const checkboxes = document.querySelectorAll('.result-checkbox');
        const rows = document.querySelectorAll('#resultsBody tr');
        
        checkboxes.forEach((cb, index) => {
            cb.checked = select;
            const resultId = cb.getAttribute('data-id');
            
            if (select) {
                this.selectedResults.add(resultId);
                rows[index]?.classList.add('selected-row');
            } else {
                this.selectedResults.delete(resultId);
                rows[index]?.classList.remove('selected-row');
            }
        });
        
        const selectAll = document.getElementById('selectAll');
        selectAll.checked = select;
        selectAll.indeterminate = false;
    }
    
    updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.result-checkbox');
        const selectAll = document.getElementById('selectAll');
        
        if (checkboxes.length === 0) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
            return;
        }
        
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        const allChecked = checkedCount === checkboxes.length;
        const anyChecked = checkedCount > 0;
        
        selectAll.checked = allChecked;
        selectAll.indeterminate = anyChecked && !allChecked;
    }
    
    updateStats() {
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        const filteredResults = this.applyFilters(savedResults);
        
        // Update total scans
        document.getElementById('totalScans').textContent = filteredResults.length;
        
        // Calculate signals found (all results are signals)
        document.getElementById('signalsFound').textContent = filteredResults.length;
        
        // Calculate accuracy (weighted by confidence)
        let accuracy = 0;
        if (filteredResults.length > 0) {
            const totalConfidence = filteredResults.reduce((sum, r) => sum + r.confidence, 0);
            accuracy = Math.round(totalConfidence / filteredResults.length);
        }
        document.getElementById('accuracyRate').textContent = accuracy + '%';
        
        // Find best scanner (most signals)
        const scannerCounts = {};
        filteredResults.forEach(result => {
            scannerCounts[result.scannerType] = (scannerCounts[result.scannerType] || 0) + 1;
        });
        
        let bestScanner = '--';
        let maxCount = 0;
        Object.entries(scannerCounts).forEach(([scanner, count]) => {
            if (count > maxCount) {
                maxCount = count;
                bestScanner = scanner;
            }
        });
        
        // Limit scanner name length
        if (bestScanner.length > 15) {
            bestScanner = bestScanner.substring(0, 15) + '...';
        }
        
        document.getElementById('bestScanner').textContent = bestScanner;
    }
    
    viewResultDetails(resultId) {
        const result = this.filteredResults.find(r => r.id === resultId);
        if (!result) {
            this.showNotification('Result not found', 'error');
            return;
        }
        
        // Create modal with result details
        const modalHtml = `
            <div class="modal-overlay" id="resultModal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-chart-bar"></i> Scan Result Details</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="result-detail-grid">
                            <div class="detail-item">
                                <label>Scanner Type:</label>
                                <span class="scanner-badge">${result.scannerType}</span>
                            </div>
                            <div class="detail-item">
                                <label>Stock:</label>
                                <span><strong>${result.symbol}</strong> - ${result.name || result.symbol}</span>
                            </div>
                            <div class="detail-item">
                                <label>Signal:</label>
                                <span class="signal-badge ${this.getSignalClass(result.signal)}">
                                    ${result.signal}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Confidence:</label>
                                <div class="confidence-meter">
                                    <div class="meter-bar">
                                        <div class="meter-fill" style="width: ${result.confidence}%"></div>
                                    </div>
                                    <span class="meter-value">${result.confidence}%</span>
                                </div>
                            </div>
                            <div class="detail-item">
                                <label>Price:</label>
                                <span class="price">₹${result.currentPrice?.toFixed(2) || '--'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Change:</label>
                                <span class="change ${result.priceChange >= 0 ? 'positive' : 'negative'}">
                                    ${result.priceChange >= 0 ? '+' : ''}${result.priceChange?.toFixed(2)}%
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Performance:</label>
                                <span class="performance-indicator ${this.getPerformanceClass(result.confidence)}">
                                    ${this.getPerformanceText(result.confidence)}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Scan Time:</label>
                                <span>${this.formatDate(result.savedAt)} ${this.formatTime(result.savedAt)}</span>
                            </div>
                        </div>
                        
                        <div class="result-notes" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <label style="display: block; margin-bottom: 10px; font-weight: 600;">Notes:</label>
                            <textarea id="resultNotes" placeholder="Add your notes here..." 
                                      style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; min-height: 100px;">${result.notes || ''}</textarea>
                            <button onclick="window.resultsManager.saveNotes('${resultId}')" 
                                    class="btn-primary" 
                                    style="margin-top: 10px;">
                                <i class="fas fa-save"></i> Save Notes
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i> Close
                        </button>
                        <button class="btn-primary" onclick="window.resultsManager.tradeThis('${resultId}')">
                            <i class="fas fa-exchange-alt"></i> Trade This
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles if not already present
        if (!document.getElementById('modalStyles')) {
            const style = document.createElement('style');
            style.id = 'modalStyles';
            style.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .modal-content {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: modalFadeIn 0.3s ease;
                }
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .modal-header {
                    padding: 20px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h3 {
                    margin: 0;
                    color: #1e293b;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    color: #64748b;
                    cursor: pointer;
                    padding: 5px;
                }
                .modal-body {
                    padding: 20px;
                    max-height: 70vh;
                    overflow-y: auto;
                }
                .modal-footer {
                    padding: 20px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .result-detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }
                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .detail-item label {
                    font-weight: 600;
                    color: #475569;
                    font-size: 0.9rem;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    saveNotes(resultId) {
        const notes = document.getElementById('resultNotes')?.value;
        let savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        const index = savedResults.findIndex(r => r.id === resultId);
        if (index !== -1) {
            savedResults[index].notes = notes;
            localStorage.setItem('savedResults', JSON.stringify(savedResults));
            this.showNotification('Notes saved successfully', 'success');
        }
    }
    
    tradeThis(resultId) {
        const result = this.filteredResults.find(r => r.id === resultId);
        if (result) {
            alert(`Initiating trade for ${result.symbol} based on ${result.scannerType} signal`);
            // In real app, this would open a trading interface
        }
    }
    
    saveToWatchlist(resultId) {
        const result = this.filteredResults.find(r => r.id === resultId);
        if (!result) return;
        
        let watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        
        // Check if already in watchlist
        if (watchlist.some(item => item.id === resultId || item.symbol === result.symbol)) {
            this.showNotification(`${result.symbol} is already in your watchlist`, 'warning');
            return;
        }
        
        watchlist.push({
            ...result,
            addedAt: new Date().toISOString(),
            notes: ''
        });
        
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        this.showNotification(`${result.symbol} added to watchlist`, 'success');
    }
    
    exportAllResults() {
        if (this.filteredResults.length === 0) {
            this.showNotification('No results to export', 'warning');
            return;
        }
        
        // Create CSV content
        const headers = ['Date', 'Time', 'Scanner', 'Symbol', 'Name', 'Signal', 'Confidence%', 'Price', 'Change%', 'Performance'];
        const csvRows = [
            headers.join(','),
            ...this.filteredResults.map(r => [
                this.formatDate(r.savedAt),
                this.formatTime(r.savedAt),
                `"${r.scannerType}"`,
                r.symbol,
                `"${r.name || r.symbol}"`,
                `"${r.signal}"`,
                r.confidence + '%',
                '₹' + (r.currentPrice?.toFixed(2) || '0'),
                (r.priceChange?.toFixed(2) || '0') + '%',
                this.getPerformanceText(r.confidence)
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `IncomePlus_Results_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification(`${this.filteredResults.length} results exported successfully`, 'success');
    }
    
    deleteSelectedResults() {
        if (this.selectedResults.size === 0) {
            this.showNotification('No results selected', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${this.selectedResults.size} selected result(s)? This action cannot be undone.`)) {
            return;
        }
        
        let savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        const originalCount = savedResults.length;
        
        // Filter out selected results
        savedResults = savedResults.filter(result => {
            const resultId = result.id || `${result.symbol}_${result.savedAt}`;
            return !this.selectedResults.has(resultId);
        });
        
        localStorage.setItem('savedResults', JSON.stringify(savedResults));
        this.selectedResults.clear();
        
        // Reload results
        this.loadResults();
        this.updateStats();
        
        // Update charts
        if (window.chartManager) {
            window.chartManager.updateAllCharts();
        }
        
        const deletedCount = originalCount - savedResults.length;
        this.showNotification(`${deletedCount} result(s) deleted successfully`, 'success');
    }
    
    deleteSingleResult(resultId) {
        if (!confirm('Are you sure you want to delete this result?')) return;
        
        let savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        savedResults = savedResults.filter(result => {
            const id = result.id || `${result.symbol}_${result.savedAt}`;
            return id !== resultId;
        });
        
        localStorage.setItem('savedResults', JSON.stringify(savedResults));
        this.selectedResults.delete(resultId);
        
        // Reload results
        this.loadResults();
        this.updateStats();
        
        // Update charts
        if (window.chartManager) {
            window.chartManager.updateAllCharts();
        }
        
        this.showNotification('Result deleted successfully', 'success');
    }
    
    addSampleData() {
        const sampleResults = SampleDataGenerator.generateSampleResults(10);
        let savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        savedResults = [...sampleResults, ...savedResults];
        localStorage.setItem('savedResults', JSON.stringify(savedResults));
        
        this.loadResults();
        this.updateStats();
        
        // Update charts
        if (window.chartManager) {
            window.chartManager.updateAllCharts();
        }
        
        this.showNotification('10 sample results added', 'success');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                 type === 'error' ? 'exclamation-circle' : 
                                 type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="toast-content">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <p>${message}</p>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.toast-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    scrollToResults() {
        const resultsTable = document.querySelector('.results-table-container');
        if (resultsTable) {
            resultsTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize results manager
    window.resultsManager = new ResultsManager();
    
    // Update user info
    updateUserInfo();
});

function updateUserInfo() {
    // Get user data from localStorage or your auth system
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    const userName = document.getElementById('userName');
    const currentPlan = document.getElementById('currentPlan');
    const planExpiry = document.getElementById('planExpiry');
    
    if (userName) userName.textContent = userData.name || 'User';
    if (currentPlan) currentPlan.textContent = userData.plan || 'Trial';
    if (planExpiry) {
        if (userData.expiry) {
            planExpiry.textContent = `Expires: ${new Date(userData.expiry).toLocaleDateString()}`;
        } else {
            planExpiry.textContent = 'Expires: --';
        }
    }
}
