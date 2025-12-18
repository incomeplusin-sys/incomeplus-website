// IncomePlus Main JavaScript - Updated with Stock Scanner

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        if (mobileMenu.classList.contains('hidden')) {
            icon.className = 'fas fa-bars text-2xl';
        } else {
            icon.className = 'fas fa-times text-2xl';
        }
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu && mobileMenuBtn && !mobileMenu.classList.contains('hidden') && 
        !mobileMenu.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.add('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        icon.className = 'fas fa-bars text-2xl';
    }
});

// Pricing page toggle
if (window.location.pathname.includes('pricing.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        const monthlyBtn = document.getElementById('monthlyBtn');
        const yearlyBtn = document.getElementById('yearlyBtn');
        const monthlyPrices = document.querySelectorAll('.monthly-price');
        const yearlyPrices = document.querySelectorAll('.yearly-price');
        
        if (monthlyBtn && yearlyBtn) {
            monthlyBtn.addEventListener('click', () => {
                monthlyBtn.classList.add('bg-white', 'text-blue-600');
                monthlyBtn.classList.remove('text-white');
                yearlyBtn.classList.remove('bg-white', 'text-blue-600');
                yearlyBtn.classList.add('text-white');
                
                monthlyPrices.forEach(p => p.classList.remove('hidden'));
                yearlyPrices.forEach(p => p.classList.add('hidden'));
            });
            
            yearlyBtn.addEventListener('click', () => {
                yearlyBtn.classList.add('bg-white', 'text-blue-600');
                yearlyBtn.classList.remove('text-white');
                monthlyBtn.classList.remove('bg-white', 'text-blue-600');
                monthlyBtn.classList.add('text-white');
                
                yearlyPrices.forEach(p => p.classList.remove('hidden'));
                monthlyPrices.forEach(p => p.classList.add('hidden'));
            });
        }
    });
}

// Add notification system
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white notification`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Add tooltip functionality
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg';
            tooltip.textContent = this.dataset.tooltip;
            tooltip.style.top = (this.offsetTop - 30) + 'px';
            tooltip.style.left = (this.offsetLeft + this.offsetWidth/2) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.id = 'tooltip-' + Date.now();
            
            this.appendChild(tooltip);
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = this.querySelector('[class*="absolute"]');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
    
    // Add current year to footer
    const yearSpans = document.querySelectorAll('.current-year');
    if (yearSpans.length > 0) {
        const currentYear = new Date().getFullYear();
        yearSpans.forEach(span => {
            span.textContent = currentYear;
        });
    }
});

// Export functionality for scanner pages
window.exportToCSV = function(data, filename) {
    if (!data || data.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }
    
    let csv = '';
    const headers = Object.keys(data[0]);
    csv += headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csv += values.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `incomeplus_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Export completed successfully', 'success');
};

// Print functionality
window.printPage = function(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        window.print();
        return;
    }
    
    const originalContent = document.body.innerHTML;
    const printContent = element.innerHTML;
    
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IncomePlus Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1, h2, h3 { color: #333; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .print-header { text-align: center; margin-bottom: 30px; }
                .print-footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>IncomePlus Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            ${printContent}
            <div class="print-footer">
                <p>&copy; ${new Date().getFullYear()} IncomePlus. All rights reserved.</p>
                <p>For educational purposes only. Not financial advice.</p>
            </div>
        </body>
        </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
};
