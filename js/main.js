// Global Functions and Utilities

class App {
    constructor() {
        this.init();
    }
    
    init() {
        // Initialize common functionality
        this.setupMobileMenu();
        this.setupNotifications();
        this.updateCurrentYear();
        this.setupTooltips();
        this.setupForms();
        this.checkSession();
    }
    
    setupMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuBtn && sidebar) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
            
            // Close sidebar when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            });
        }
    }
    
    setupNotifications() {
        // Load notifications from server
        this.loadNotifications();
        
        // Setup notification bell if exists
        const notificationBell = document.getElementById('notificationBell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => this.toggleNotifications());
        }
    }
    
    async loadNotifications() {
        try {
            const response = await fetch('/php/notifications.php');
            const data = await response.json();
            
            if (data.success && data.notifications) {
                this.updateNotificationBadge(data.notifications.length);
                this.renderNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }
    
    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    renderNotifications(notifications) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        if (notifications.length === 0) {
            container.innerHTML = '<div class="no-notifications">No new notifications</div>';
            return;
        }
        
        const html = notifications.map(notif => `
            <div class="notification-item ${notif.unread ? 'unread' : ''}" data-id="${notif.id}">
                <div class="notification-icon">
                    <i class="fas fa-${notif.icon || 'bell'}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.formatTime(notif.created_at)}</div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    toggleNotifications() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
            panel.classList.toggle('active');
        }
    }
    
    setupTooltips() {
        // Initialize tooltips
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = element.dataset.tooltip;
                document.body.appendChild(tooltip);
                
                const rect = element.getBoundingClientRect();
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
                
                element.dataset.tooltipId = tooltip.id;
            });
            
            element.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById(element.dataset.tooltipId);
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }
    
    setupForms() {
        // Setup form validation
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.validateForm(e, form));
        });
    }
    
    validateForm(e, form) {
        e.preventDefault();
        
        let isValid = true;
        const inputs = form.querySelectorAll('input[required], select[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                this.showInputError(input, 'This field is required');
            } else {
                this.clearInputError(input);
                
                // Email validation
                if (input.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        isValid = false;
                        this.showInputError(input, 'Please enter a valid email address');
                    }
                }
                
                // Password validation
                if (input.type === 'password' && input.id === 'newPassword') {
                    if (input.value.length < 8) {
                        isValid = false;
                        this.showInputError(input, 'Password must be at least 8 characters');
                    }
                }
                
                // Confirm password
                if (input.id === 'confirmPassword') {
                    const password = form.querySelector('#newPassword');
                    if (password && input.value !== password.value) {
                        isValid = false;
                        this.showInputError(input, 'Passwords do not match');
                    }
                }
            }
        });
        
        if (isValid) {
            form.submit();
        }
    }
    
    showInputError(input, message) {
        input.classList.add('error');
        
        let errorElement = input.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
        
        errorElement.textContent = message;
    }
    
    clearInputError(input) {
        input.classList.remove('error');
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
    
    async checkSession() {
        try {
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'check_session' })
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                this.updateUserInfo(data.user);
            } else {
                // Redirect to login if not on login page
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = '/login.html';
                }
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
    }
    
    updateUserInfo(user) {
        // Update user name in all elements
        const userNameElements = document.querySelectorAll('.user-name, #userName, #greetingName, #sidebarUserName');
        userNameElements.forEach(element => {
            if (user.full_name) {
                element.textContent = user.full_name;
            } else if (user.email) {
                element.textContent = user.email.split('@')[0];
            }
        });
        
        // Update plan info
        const planElements = document.querySelectorAll('#currentPlan, #profilePlan, .user-plan-small');
        const expiryElements = document.querySelectorAll('#planExpiry, #profileExpiry');
        
        planElements.forEach(element => {
            if (user.subscription_type) {
                element.textContent = user.subscription_type.charAt(0).toUpperCase() + user.subscription_type.slice(1);
                
                // Update badge color based on plan
                if (user.subscription_type === 'trial') {
                    element.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                } else if (user.subscription_type === 'monthly') {
                    element.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                } else if (user.subscription_type === 'annual') {
                    element.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                }
            }
        });
        
        expiryElements.forEach(element => {
            if (user.subscription_end) {
                const daysLeft = this.daysBetween(new Date(), new Date(user.subscription_end));
                if (user.subscription_type === 'trial') {
                    element.textContent = `Expires in ${daysLeft} days`;
                } else {
                    element.textContent = `Expires: ${new Date(user.subscription_end).toLocaleDateString()}`;
                }
            }
        });
    }
    
    daysBetween(date1, date2) {
        const diff = Math.abs(date2 - date1);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) {
            return `${minutes} min ago`;
        } else if (hours < 24) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (days < 7) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
    
    updateCurrentYear() {
        const yearElements = document.querySelectorAll('.current-year');
        const currentYear = new Date().getFullYear();
        yearElements.forEach(element => {
            element.textContent = currentYear;
        });
    }
    
    // Toast notifications
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });
    }
    
    // Loading indicator
    showLoading() {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        document.body.appendChild(loader);
        return loader;
    }
    
    hideLoading(loader) {
        if (loader) {
            loader.remove();
        }
    }
    
    // Confirmation dialog
    confirmDialog(message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <h3>Confirm</h3>
                    <p>${message}</p>
                    <div class="dialog-buttons">
                        <button class="btn-secondary" id="dialogCancel">Cancel</button>
                        <button class="btn-primary" id="dialogConfirm">Confirm</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            dialog.querySelector('#dialogCancel').addEventListener('click', () => {
                dialog.remove();
                resolve(false);
            });
            
            dialog.querySelector('#dialogConfirm').addEventListener('click', () => {
                dialog.remove();
                resolve(true);
            });
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Global utility functions
function formatNumber(num) {
    if (num >= 10000000) {
        return (num / 10000000).toFixed(2) + 'Cr';
    } else if (num >= 100000) {
        return (num / 100000).toFixed(2) + 'L';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Download file utility
function downloadFile(data, filename, type = 'text/csv') {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        app.showToast('Copied to clipboard', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        app.showToast('Failed to copy', 'error');
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
