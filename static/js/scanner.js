// Scanner-specific JavaScript for IncomePlus

class ScannerInterface {
    constructor() {
        this.scanInProgress = false;
        this.currentScanId = null;
        this.progressInterval = null;
    }
    
    init() {
        // Initialize scanner form
        const scannerForm = document.getElementById('scanner-form');
        if (scannerForm) {
            scannerForm.addEventListener('submit', (e) => this.handleScanSubmit(e));
        }
        
        // Initialize advanced options toggle
        const toggleBtn = document.getElementById('toggle-advanced');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAdvancedOptions());
        }
        
        // Initialize scan type selection
        const scanTypes = document.querySelectorAll('input[name="scan_type"]');
        scanTypes.forEach(type => {
            type.addEventListener('change', () => this.updateScannerOptions());
        });
    }
    
    handleScanSubmit(e) {
        e.preventDefault();
        
        if (this.scanInProgress) {
            alert('A scan is already in progress');
            return;
        }
        
        // Get form data
        const formData = new FormData(e.target);
        const target = formData.get('target');
        const scanType = formData.get('scan_type');
        const complianceAgree = document.getElementById('compliance-agree');
        
        // Validation
        if (!target || target.trim() === '') {
            alert('Please enter a target to scan');
            return;
        }
        
        if (!complianceAgree || !complianceAgree.checked) {
            alert('You must agree to the compliance terms before scanning');
            return;
        }
        
        // Check for blacklisted domains
        if (this.isBlacklisted(target)) {
            alert('This target is not allowed per compliance policy');
            return;
        }
        
        // Start scan
        this.startScan(target, scanType);
    }
    
    isBlacklisted(target) {
        const blacklisted = [
            '.gov.in', '.nic.in', '.mil.in',
            '.gov.', '.mil.', 'localhost',
            '127.0.0.1', '192.168.', '10.'
        ];
        
        const targetLower = target.toLowerCase();
        return blacklisted.some(item => targetLower.includes(item));
    }
    
    async startScan(target, scanType) {
        this.scanInProgress = true;
        
        // Show loading state
        this.showLoading();
        
        try {
            // Send scan request to server
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    target: target,
                    scan_type: scanType
                })
            });
            
            const data = await response.json();
            
            if (data.scan_id) {
                this.currentScanId = data.scan_id;
                this.startProgressMonitoring(data.scan_id);
            } else {
                throw new Error(data.error || 'Failed to start scan');
            }
            
        } catch (error) {
            console.error('Scan error:', error);
            this.showError(error.message);
            this.scanInProgress = false;
        }
    }
    
    startProgressMonitoring(scanId) {
        // Show progress area
        const resultsArea = document.getElementById('results-area');
        if (resultsArea) {
            resultsArea.classList.remove('hidden');
        }
        
        // Start polling for progress
        this.progressInterval = setInterval(() => {
            this.checkScanProgress(scanId);
        }, 2000);
    }
    
    async checkScanProgress(scanId) {
        try {
            const response = await fetch(`/api/scan/${scanId}/status`);
            const data = await response.json();
            
            // Update progress bar
            const progressBar = document.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
            const scanStatus = document.getElementById('scan-status');
            
            if (progressBar && progressText && scanStatus) {
                const progress = data.progress || 0;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
                scanStatus.textContent = this.getStatusText(data.status);
                
                // Check if scan is complete
                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(this.progressInterval);
                    this.scanInProgress = false;
                    
                    if (data.status === 'completed') {
                        this.loadScanResults(scanId);
                    } else {
                        this.showError(data.error || 'Scan failed');
                    }
                }
            }
            
        } catch (error) {
            console.error('Progress check error:', error);
        }
    }
    
    async loadScanResults(scanId) {
        try {
            const response = await fetch(`/api/scan/${scanId}/results`);
            const data = await response.json();
            
            // Hide progress, show results
            this.hideLoading();
            this.displayResults(data);
            
        } catch (error) {
            console.error('Results load error:', error);
            this.showError('Failed to load results');
        }
    }
    
    displayResults(results) {
        const resultsContainer = document.getElementById('scan-results');
        if (!resultsContainer) return;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Create results HTML
        let html = `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Scan Results</h3>
                    <div class="flex space-x-2">
                        <button onclick="window.print()" class="px-3 py-1 border rounded hover:bg-gray-50">
                            <i class="fas fa-print mr-1"></i>Print
                        </button>
                        <button onclick="exportResults()" class="px-3 py-1 border rounded hover:bg-gray-50">
                            <i class="fas fa-download mr-1"></i>Export
                        </button>
                    </div>
                </div>
                
                <!-- Summary -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-gray-50 p-4 rounded text-center">
                        <div class="text-2xl font-bold">${results.summary?.total_checks || 0}</div>
                        <div class="text-sm text-gray-600">Total Checks</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded text-center">
                        <div class="text-2xl font-bold ${this.getRiskColor(results.summary?.risk_score)}">
                            ${results.summary?.vulnerabilities_found || 0}
                        </div>
                        <div class="text-sm text-gray-600">Issues Found</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded text-center">
                        <div class="text-2xl font-bold">${results.summary?.risk_score?.toFixed(1) || '0.0'}/10</div>
                        <div class="text-sm text-gray-600">Risk Score</div>
                    </div>
                    <div class="bg-gray-50 p-4 rounded text-center">
                        <div class="text-2xl font-bold">${results.summary?.scan_duration?.toFixed(1) || '0.0'}s</div>
                        <div class="text-sm text-gray-600">Duration</div>
                    </div>
                </div>
        `;
        
        // Add findings if any
        if (results.findings && results.findings.length > 0) {
            html += `
                <div class="mb-6">
                    <h4 class="font-bold mb-3">Findings</h4>
                    <div class="space-y-3">
            `;
            
            results.findings.forEach(finding => {
                const severityClass = this.getSeverityClass(finding.severity);
                html += `
                    <div class="border rounded p-4 ${severityClass.bg}">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="font-medium">${finding.type || 'Finding'}</span>
                                <span class="ml-2">${finding.description || ''}</span>
                            </div>
                            <span class="px-2 py-1 rounded text-xs ${severityClass.text} ${severityClass.border}">
                                ${finding.severity || 'info'}
                            </span>
                        </div>
                        ${finding.location ? `<p class="text-sm mb-1"><strong>Location:</strong> ${finding.location}</p>` : ''}
                        ${finding.recommendation ? `<p class="text-sm"><strong>Recommendation:</strong> ${finding.recommendation}</p>` : ''}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="bg-green-50 border border-green-200 rounded p-4 mb-6">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-600 mr-3"></i>
                        <div>
                            <p class="font-medium">No vulnerabilities found</p>
                            <p class="text-sm">The target appears to be secure based on the scan</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add compliance check
        html += `
            <div class="border-t pt-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fas ${results.compliance_check === 'PASSED' ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600'} mr-2"></i>
                        <span>Compliance Check: <strong>${results.compliance_check || 'PASSED'}</strong></span>
                    </div>
                    <span class="text-xs text-gray-500">Scan ID: ${this.currentScanId || 'N/A'}</span>
                </div>
            </div>
        `;
        
        html += `</div>`;
        
        resultsContainer.innerHTML = html;
        resultsContainer.classList.remove('hidden');
    }
    
    getRiskColor(score) {
        if (score >= 8) return 'text-red-600';
        if (score >= 6) return 'text-orange-600';
        if (score >= 4) return 'text-yellow-600';
        if (score >= 2) return 'text-blue-600';
        return 'text-green-600';
    }
    
    getSeverityClass(severity) {
        const classes = {
            'critical': { bg: 'bg-red-50 border-red-200', text: 'text-red-800', border: 'bg-red-100' },
            'high': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', border: 'bg-orange-100' },
            'medium': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', border: 'bg-yellow-100' },
            'low': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', border: 'bg-blue-100' },
            'info': { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-800', border: 'bg-gray-100' }
        };
        
        return classes[severity?.toLowerCase()] || classes.info;
    }
    
    getStatusText(status) {
        const statusTexts = {
            'pending': 'Waiting in queue...',
            'running': 'Scanning in progress...',
            'completed': 'Scan completed!',
            'failed': 'Scan failed',
            'blocked': 'Scan blocked by compliance'
        };
        
        return statusTexts[status] || 'Unknown status';
    }
    
    showLoading() {
        const submitBtn = document.querySelector('#scanner-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting Scan...';
            submitBtn.disabled = true;
        }
    }
    
    hideLoading() {
        const submitBtn = document.querySelector('#scanner-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Start New Scan';
            submitBtn.disabled = false;
        }
    }
    
    showError(message) {
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 border border-red-200 text-red-800 rounded p-4 mb-4';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-3"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Insert at top of form
        const form = document.getElementById('scanner-form');
        if (form) {
            form.prepend(errorDiv);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 5000);
        }
    }
    
    toggleAdvancedOptions() {
        const options = document.getElementById('advanced-options');
        const toggleBtn = document.getElementById('toggle-advanced');
        
        if (options && toggleBtn) {
            const isHidden = options.classList.contains('hidden');
            
            if (isHidden) {
                options.classList.remove('hidden');
                toggleBtn.innerHTML = '<i class="fas fa-chevron-up mr-2"></i>Hide Advanced Options';
            } else {
                options.classList.add('hidden');
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down mr-2"></i>Show Advanced Options';
            }
        }
    }
    
    updateScannerOptions() {
        // Update available options based on selected scan type
        const selectedType = document.querySelector('input[name="scan_type"]:checked');
        if (!selectedType) return;
        
        const advancedOptions = document.getElementById('advanced-options');
        if (advancedOptions) {
            // Customize options based on scan type
            // This is a simplified implementation
        }
    }
}

// Export functions
function exportResults() {
    alert('Export functionality would generate PDF/JSON report in production');
}

// Initialize scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const scanner = new ScannerInterface();
    scanner.init();
});
