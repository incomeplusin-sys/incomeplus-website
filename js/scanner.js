// Security Scanner - Frontend Demo Only

class SecurityScannerDemo {
    constructor() {
        this.isScanning = false;
    }

    startDemoScan(url) {
        this.isScanning = true;
        
        // Show loading
        document.getElementById('scanProgress').classList.remove('hidden');
        document.getElementById('scanBtn').disabled = true;
        
        // Simulate scanning progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            document.getElementById('progressBar').style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                this.showDemoResults(url);
                this.isScanning = false;
                document.getElementById('scanProgress').classList.add('hidden');
                document.getElementById('scanBtn').disabled = false;
            }
        }, 300);
    }

    showDemoResults(url) {
        // DEMO RESULTS - Not real scanning
        const demoResults = {
            url: url,
            timestamp: new Date().toISOString(),
            status: 'demo_mode',
            vulnerabilities: [
                {
                    name: 'SQL Injection Vulnerability',
                    severity: 'high',
                    description: 'Potential SQL injection points detected in form inputs',
                    recommendation: 'Use parameterized queries and input validation'
                },
                {
                    name: 'XSS (Cross-Site Scripting)',
                    severity: 'medium',
                    description: 'User input not properly sanitized',
                    recommendation: 'Implement Content Security Policy (CSP)'
                },
                {
                    name: 'SSL/TLS Configuration',
                    severity: 'low',
                    description: 'SSL certificate is valid but could be improved',
                    recommendation: 'Upgrade to TLS 1.3'
                }
            ],
            disclaimer: '⚠️ This is a DEMO scan only. For actual security testing, use professional tools with proper authorization.'
        };
        
        this.displayResults(demoResults);
    }

    displayResults(results) {
        const container = document.getElementById('resultsContainer');
        let html = `
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-xl font-bold mb-4">🔍 Security Scan Results (Demo)</h3>
                <p class="text-gray-600 mb-4">Scanned: ${results.url}</p>
                
                <div class="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p class="text-blue-700">
                        <i class="fas fa-info-circle mr-2"></i>
                        ${results.disclaimer}
                    </p>
                </div>
                
                <div class="space-y-4">
        `;
        
        results.vulnerabilities.forEach(vuln => {
            const severityColor = {
                'high': 'bg-red-100 text-red-800',
                'medium': 'bg-yellow-100 text-yellow-800',
                'low': 'bg-green-100 text-green-800'
            }[vuln.severity] || 'bg-gray-100 text-gray-800';
            
            html += `
                <div class="border-l-4 ${vuln.severity === 'high' ? 'border-red-500' : vuln.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'} pl-4 py-3">
                    <div class="flex justify-between">
                        <h4 class="font-bold">${vuln.name}</h4>
                        <span class="px-3 py-1 rounded-full text-sm ${severityColor}">
                            ${vuln.severity.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-gray-600 mt-2">${vuln.description}</p>
                    <p class="text-blue-600 font-medium mt-2">
                        <i class="fas fa-lightbulb mr-2"></i>${vuln.recommendation}
                    </p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        document.getElementById('scanResults').classList.remove('hidden');
    }
}

// Global instance
const securityScanner = new SecurityScannerDemo();

// Expose to window
window.startSecurityScan = () => {
    const url = document.getElementById('targetUrl').value || 'https://example.com';
    securityScanner.startDemoScan(url);
};
