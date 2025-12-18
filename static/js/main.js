// IncomePlus Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Flash messages auto-hide
    const flashMessages = document.querySelectorAll('.alert, .flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentElement) {
                    message.remove();
                }
            }, 500);
        }, 5000);
    });
    
    // Age verification
    const ageForm = document.getElementById('age-form');
    if (ageForm) {
        ageForm.addEventListener('submit', function(e) {
            if (!document.getElementById('age-check').checked) {
                e.preventDefault();
                alert('You must confirm you are 18 or older to use this service.');
                return false;
            }
        });
    }
    
    // Terms agreement validation
    const registerForm = document.querySelector('form[action="/register"]');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const termsCheck = document.getElementById('terms');
            const ageCheck = document.getElementById('age');
            
            if (!termsCheck || !termsCheck.checked) {
                e.preventDefault();
                alert('You must agree to the Terms of Service.');
                return false;
            }
            
            if (!ageCheck || !ageCheck.checked) {
                e.preventDefault();
                alert('You must confirm you are 18 years or older.');
                return false;
            }
            
            // Password validation
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm-password');
            
            if (password && confirmPassword && password.value !== confirmPassword.value) {
                e.preventDefault();
                alert('Passwords do not match.');
                return false;
            }
            
            if (password && password.value.length < 8) {
                e.preventDefault();
                alert('Password must be at least 8 characters long.');
                return false;
            }
        });
    }
    
    // Scanner compliance checkbox
    const scannerForm = document.getElementById('scanner-form');
    if (scannerForm) {
        scannerForm.addEventListener('submit', function(e) {
            const complianceCheck = document.getElementById('compliance-check');
            
            if (complianceCheck && !complianceCheck.checked) {
                e.preventDefault();
                alert('You must agree to the compliance terms before scanning.');
                return false;
            }
        });
    }
    
    // Toggle advanced options
    const toggleButtons = document.querySelectorAll('[data-toggle]');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle');
            const target = document.getElementById(targetId);
            if (target) {
                target.classList.toggle('hidden');
                
                // Toggle icon
                const icon = this.querySelector('i');
                if (icon) {
                    if (target.classList.contains('hidden')) {
                        icon.className = 'fas fa-chevron-down';
                    } else {
                        icon.className = 'fas fa-chevron-up';
                    }
                }
            }
        });
    });
    
    // Tab switching
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active from all tabs
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                btn.classList.add('text-gray-600');
            });
            
            // Add active to clicked tab
            this.classList.add('active', 'bg-blue-100', 'text-blue-700');
            this.classList.remove('text-gray-600');
            
            // Hide all tab content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show selected tab content
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.remove('hidden');
            }
        });
    });
    
    // Copy to clipboard buttons
    const copyButtons = document.querySelectorAll('[data-copy]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const text = this.getAttribute('data-copy');
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
                this.classList.add('text-green-600');
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('text-green-600');
                }, 2000);
            });
        });
    });
    
    // Scan progress simulation
    const scanProgress = document.getElementById('scan-progress');
    if (scanProgress) {
        simulateScanProgress();
    }
    
    // Timezone display
    const timeElements = document.querySelectorAll('[data-time]');
    timeElements.forEach(element => {
        const timestamp = element.getAttribute('data-time');
        if (timestamp) {
            const date = new Date(timestamp);
            element.textContent = date.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        }
    });
});

// Scan progress simulation
function simulateScanProgress() {
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const scanStatus = document.getElementById('scan-status');
    
    if (!progressBar || !progressText) return;
    
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = progress + '%';
        progressText.textContent = Math.round(progress) + '%';
        
        if (scanStatus) {
            if (progress < 30) {
                scanStatus.textContent = 'Initializing scan...';
            } else if (progress < 60) {
                scanStatus.textContent = 'Checking vulnerabilities...';
            } else if (progress < 90) {
                scanStatus.textContent = 'Analyzing results...';
            } else {
                scanStatus.textContent = 'Finalizing report...';
            }
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            if (scanStatus) {
                scanStatus.textContent = 'Scan completed!';
                scanStatus.classList.add('text-green-600');
            }
            
            // Show results after delay
            setTimeout(() => {
                const resultsSection = document.getElementById('scan-results');
                if (resultsSection) {
                    resultsSection.classList.remove('hidden');
                }
            }, 1000);
        }
    }, 500);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Time since
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return Math.floor(seconds) + ' seconds ago';
}

// Export for use in scanner.js
window.IncomePlus = {
    formatFileSize,
    timeSince
};
