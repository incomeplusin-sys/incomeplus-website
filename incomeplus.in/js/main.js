// Main JavaScript for IncomePlus Scanner

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuBtn.className = 'mobile-menu-btn';
    
    if (window.innerWidth <= 768) {
        const header = document.querySelector('.header .container');
        header.appendChild(mobileMenuBtn);
        
        mobileMenuBtn.addEventListener('click', function() {
            const nav = document.querySelector('.main-nav');
            nav.classList.toggle('show');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Update trial info based on URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('trial_expired')) {
        showNotification('Your free trial has expired. Please subscribe to continue.', 'warning');
    }
    
    // Demo scanner preview animation
    const scanResults = document.querySelectorAll('.scan-result');
    if (scanResults.length > 0) {
        setInterval(() => {
            scanResults.forEach(result => {
                const confidence = result.querySelector('.confidence');
                if (confidence) {
                    const currentValue = parseInt(confidence.textContent);
                    const newValue = Math.min(95, Math.max(60, currentValue + (Math.random() * 10 - 5)));
                    confidence.textContent = Math.round(newValue) + '%';
                    
                    if (newValue >= 80) {
                        confidence.className = 'confidence high';
                    } else if (newValue >= 70) {
                        confidence.className = 'confidence medium';
                    } else {
                        confidence.className = 'confidence low';
                    }
                }
            });
        }, 3000);
    }
    
    // Form validation for landing page forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputs = this.querySelectorAll('input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#fc5c65';
                } else {
                    input.style.borderColor = '#e2e8f0';
                }
            });
            
            if (isValid) {
                // Show success message
                showNotification('Thank you for your interest! We\'ll contact you shortly.', 'success');
                this.reset();
            } else {
                showNotification('Please fill all required fields.', 'error');
            }
        });
    });
    
    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                }
                
                .notification-content {
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    min-width: 300px;
                    max-width: 400px;
                }
                
                .notification-success .notification-content {
                    border-left: 4px solid #10b981;
                }
                
                .notification-error .notification-content {
                    border-left: 4px solid #fc5c65;
                }
                
                .notification-warning .notification-content {
                    border-left: 4px solid #f59e0b;
                }
                
                .notification-info .notification-content {
                    border-left: 4px solid #3b82f6;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: #718096;
                    cursor: pointer;
                    margin-left: auto;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Add notification styles
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            }
            
            .notification-content {
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                max-width: 400px;
            }
            
            .notification-success .notification-content {
                border-left: 4px solid #10b981;
            }
            
            .notification-error .notification-content {
                border-left: 4px solid #fc5c65;
            }
            
            .notification-warning .notification-content {
                border-left: 4px solid #f59e0b;
            }
            
            .notification-info .notification-content {
                border-left: 4px solid #3b82f6;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #718096;
                cursor: pointer;
                margin-left: auto;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
});
