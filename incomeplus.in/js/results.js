// Results History Management
class ResultsManager {
    constructor() {
        this.currentPage = 1;
        this.resultsPerPage = 10;
        this.totalResults = 0;
        this.filteredResults = [];
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
        
        // Show loading
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin"></i> Loading results...
                </td>
            </tr>
        `;
        
        try {
            // Simulate loading
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Load from localStorage
            const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
            
            // Apply filters
            this.filteredResults = this.applyFilters(savedResults);
            this.totalResults = this.filteredResults.length;
            
            // Update pagination
            this.updatePagination();
            
            // Display current page
            this.displayCurrentPage();
            
        } catch (error) {
            console.error('Load results error:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class="fas fa-exclamation-circle"></i> Failed to load results
                    </td>
                </tr>
            `;
        }
    }
    
    applyFilters(results) {
        const dateRange = document.getElementById('dateRange').value;
        const scannerFilter = document.getElementById('scannerFilter').value;
        const stockFilter = document.getElementById('stockFilter').value.toLowerCase();
        
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
            }
            
            filtered = filtered.filter(result => new Date(result.savedAt) >= cutoffDate);
        }
        
        // Apply scanner filter
        if (scannerFilter !== 'all') {
            filtered = filtered.filter(result => 
                result.scannerType.toLowerCase().replace(/\s+/g, '-') === scannerFilter
            );
        }
        
        // Apply stock filter
        if (stockFilter) {
            filtered = filtered.filter(result => 
                result.symbol.toLowerCase().includes(stockFilter) || 
                result.name.toLowerCase().includes(stockFilter)
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
                    <td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">
                        <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        <p>No results found</p>
                        <p style="font-size: 0.9rem; margin-top: 10px;">Run some scans to see results here</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pageResults.map(result => `
            <tr>
                <td><input type="checkbox" class="result-checkbox" data-id="${result.id || result.symbol + result.savedAt}"></td>
                <td>
                    <div class="date-time">
                        <div class="date">${new Date(result.savedAt).toLocaleDateString()}</div>
                        <div class="time">${new Date(result.savedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
                    <span class="signal-badge ${result.signal.includes('Bullish') ? 'bullish' : result.signal.includes('Bearish') ? 'bearish' : 'neutral'}">
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
                            ${result.priceChange >= 0 ? '+' : ''}${result.priceChange?.toFixed(2) || '0'}%
                        </div>
                    </div>
                </td>
                <td>
                    <span class="performance-indicator ${this.getPerformanceClass(result)}">
                        ${this.getPerformanceText(result)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="viewResultDetails('${result.id || result.symbol}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action" onclick="deleteSingleResult('${result.id || result.symbol + result.savedAt}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Setup checkbox handlers
        this.setupCheckboxes();
    }
    
    getPerformanceClass(result) {
        if (result.confidence >= 85) return 'performance-positive';
        if (result.confidence >= 70) return 'performance-neutral';
        return 'performance-negative';
    }
    
    getPerformanceText(result) {
        if (result.confidence >= 85) return 'High';
        if (result.confidence >= 70) return 'Medium';
        return 'Low';
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.totalResults / this.resultsPerPage);
        
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        
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
                this.loadResults();
                this.updateStats();
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
                this.loadResults();
                this.updateStats();
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
                }
            });
        }
        
        // Select all checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.result-checkbox');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
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
    }
    
    setupCheckboxes() {
        const checkboxes = document.querySelectorAll('.result-checkbox');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => this.updateSelectAllState());
        });
    }
    
    updateSelectAllState() {
        const checkboxes = document.querySelectorAll('.result-checkbox');
        const selectAll = document.getElementById('selectAll');
        
        if (checkboxes.length === 0) {
            selectAll.checked = false;
            return;
        }
        
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
        
        selectAll.checked = allChecked;
        selectAll.indeterminate = anyChecked && !allChecked;
    }
    
    updateStats() {
        const savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        const filteredResults = this.applyFilters(savedResults);
        
        // Update stats
        document.getElementById('totalScans').textContent = filteredResults.length;
        document.getElementById('signalsFound').textContent = filteredResults.length;
        
        // Calculate accuracy (simulated)
        const accuracy = filteredResults.length > 0 ? 
            Math.floor(filteredResults.reduce((sum, r) => sum + r.confidence, 0) / filteredResults.length) : 0;
        document.getElementById('accuracyRate').textContent = accuracy + '%';
        
        // Find best scanner
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
        
        document.getElementById('bestScanner').textContent = bestScanner;
    }
    
    exportAllResults() {
        if (this.filteredResults.length === 0) {
            this.showNotification('No results to export', 'warning');
            return;
        }
        
        // Convert to CSV
        const headers = ['Date', 'Time', 'Scanner', 'Symbol', 'Name', 'Signal', 'Confidence', 'Price', 'Price Change'];
        const csvRows = [
            headers.join(','),
            ...this.filteredResults.map(r => [
                new Date(r.savedAt).toLocaleDateString(),
                new Date(r.savedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                `"${r.scannerType}"`,
                r.symbol,
                `"${r.name || r.symbol}"`,
                `"${r.signal}"`,
                r.confidence + '%',
                '₹' + (r.currentPrice?.toFixed(2) || '0'),
                (r.priceChange?.toFixed(2) || '0') + '%'
            ].join(','))
        ];
        
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        this.showNotification('All results exported successfully', 'success');
    }
    
    deleteSelectedResults() {
        const checkboxes = document.querySelectorAll('.result-checkbox:checked');
        if (checkboxes.length === 0) {
            this.showNotification('No results selected', 'warning');
            return;
        }
        
        if (!confirm(`Delete ${checkboxes.length} selected result(s)? This action cannot be undone.`)) {
            return;
        }
        
        const idsToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
        
        // Get current results
        let savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        // Filter out deleted results
        savedResults = savedResults.filter(result => {
            const resultId = result.id || result.symbol + result.savedAt;
            return !idsToDelete.includes(resultId);
        });
        
        // Save back
        localStorage.setItem('savedResults', JSON.stringify(savedResults));
        
        // Reload
        this.loadResults();
        this.updateStats();
        
        this.showNotification(`${checkboxes.length} result(s) deleted successfully`, 'success');
    }
    
    showNotification(message, type) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.resultsManager = new ResultsManager();
});

// Global functions
function viewResultDetails(resultId) {
    alert(`Viewing details for result ${resultId}`);
    // In real app, show detailed modal with all result data
}

function deleteSingleResult(resultId) {
    if (!confirm('Delete this result?')) return;
    
    let savedResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    savedResults = savedResults.filter(result => {
        const id = result.id || result.symbol + result.savedAt;
        return id !== resultId;
    });
    
    localStorage.setItem('savedResults', JSON.stringify(savedResults));
    
    // Reload if on results page
    if (window.resultsManager) {
        window.resultsManager.loadResults();
        window.resultsManager.updateStats();
    }
    
    alert('Result deleted successfully');
}

// Add CSS for results page
const resultsStyle = document.createElement('style');
resultsStyle.textContent = `
    .scanner-badge {
        background: #e0e7ff;
        color: #4f46e5;
        padding: 4px 10px;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .signal-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .signal-badge.bullish {
        background: #d1fae5;
        color: #065f46;
    }
    
    .signal-badge.bearish {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .signal-badge.neutral {
        background: #fef3c7;
        color: #92400e;
    }
    
    .confidence-meter {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .meter-bar {
        width: 60px;
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .meter-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        border-radius: 4px;
    }
    
    .meter-value {
        font-size: 0.9rem;
        font-weight: 600;
        color: #475569;
        min-width: 40px;
    }
    
    .price-info {
        display: flex;
        flex-direction: column;
    }
    
    .price {
        font-weight: 600;
        color: #1e293b;
    }
    
    .change {
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .change.positive {
        color: #10b981;
    }
    
    .change.negative {
        color: #ef4444;
    }
    
    .action-buttons {
        display: flex;
        gap: 8px;
    }
    
    .btn-action {
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .btn-action:hover {
        background: #4f46e5;
        color: white;
    }
    
    .date-time {
        display: flex;
        flex-direction: column;
    }
    
    .date {
        font-weight: 600;
        color: #1e293b;
    }
    
    .time {
        font-size: 0.85rem;
        color: #64748b;
    }
    
    .stock-info {
        display: flex;
        flex-direction: column;
    }
    
    .stock-info strong {
        color: #1e293b;
    }
    
    .stock-info small {
        color: #64748b;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(resultsStyle);
