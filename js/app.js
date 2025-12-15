// app.js - Global utility functions for Volume Pattern Scanner

const app = {
    // Show loading overlay
    showLoading(message = 'Loading...') {
        const loaderId = 'loading-overlay-' + Date.now();
        const loaderHTML = `
            <div id="${loaderId}" class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loaderHTML);
        
        // Add styles if not present
        if (!document.querySelector('#loading-styles')) {
            const styles = document.createElement('style');
            styles.id = 'loading-styles';
            styles.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.9);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #4f46e5;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                .loading-text {
                    margin-top: 20px;
                    color: #4a5568;
                    font-size: 0.9rem;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        return loaderId;
    },
    
    // Hide loading overlay
    hideLoading(loaderId) {
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.remove();
        }
    },
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
        
        // Create toast
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast-notification toast-${type}">
                <div class="toast-icon">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                </div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="app.closeToast('${toastId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', toastHTML);
        
        // Add styles if not present
        if (!document.querySelector('#toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    max-width: 350px;
                    transform: translateX(100%);
                    opacity: 0;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    z-index: 9999;
                    border-left: 4px solid #4f46e5;
                }
                
                .toast-notification.toast-success {
                    border-left-color: #10b981;
                }
                
                .toast-notification.toast-error {
                    border-left-color: #ef4444;
                }
                
                .toast-notification.toast-info {
                    border-left-color: #4f46e5;
                }
                
                .toast-notification.toast-hiding {
                    transform: translateX(100%);
                    opacity: 0;
                }
                
                .toast-icon {
                    font-size: 1.2rem;
                }
                
                .toast-success .toast-icon {
                    color: #10b981;
                }
                
                .toast-error .toast-icon {
                    color: #ef4444;
                }
                
                .toast-info .toast-icon {
                    color: #4f46e5;
                }
                
                .toast-message {
                    flex: 1;
                    color: #2d3748;
                    font-size: 0.9rem;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: #cbd5e0;
                    cursor: pointer;
                    padding: 4px;
                    transition: color 0.2s ease;
                }
                
                .toast-close:hover {
                    color: #718096;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Show toast with animation
        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
            }
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.closeToast(toastId);
        }, 5000);
        
        return toastId;
    },
    
    // Close toast
    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    },
    
    // Show confirmation dialog
    confirmDialog(message) {
        return new Promise((resolve) => {
            const dialogId = 'dialog-' + Date.now();
            const dialogHTML = `
                <div id="${dialogId}" class="confirmation-dialog-overlay">
                    <div class="confirmation-dialog">
                        <div class="dialog-content">
                            <i class="fas fa-question-circle dialog-icon"></i>
                            <div class="dialog-message">${message}</div>
                        </div>
                        <div class="dialog-actions">
                            <button class="btn-cancel" onclick="app.closeDialog('${dialogId}', false)">Cancel</button>
                            <button class="btn-confirm" onclick="app.closeDialog('${dialogId}', true)">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', dialogHTML);
            
            // Add styles if not present
            if (!document.querySelector('#dialog-styles')) {
                const styles = document.createElement('style');
                styles.id = 'dialog-styles';
                styles.textContent = `
                    .confirmation-dialog-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    }
                    
                    .confirmation-dialog {
                        background: white;
                        border-radius: 15px;
                        padding: 25px;
                        width: 90%;
                        max-width: 400px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    }
                    
                    .dialog-content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        margin-bottom: 25px;
                    }
                    
                    .dialog-icon {
                        font-size: 3rem;
                        color: #4f46e5;
                        margin-bottom: 15px;
                    }
                    
                    .dialog-message {
                        color: #2d3748;
                        font-size: 1rem;
                        line-height: 1.5;
                    }
                    
                    .dialog-actions {
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                    }
                    
                    .dialog-actions button {
                        padding: 10px 30px;
                        border-radius: 8px;
                        border: none;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    
                    .btn-cancel {
                        background: #f8fafc;
                        color: #4a5568;
                    }
                    
                    .btn-cancel:hover {
                        background: #e2e8f0;
                    }
                    
                    .btn-confirm {
                        background: #4f46e5;
                        color: white;
                    }
                    
                    .btn-confirm:hover {
                        background: #4338ca;
                    }
                `;
                document.head.appendChild(styles);
            }
            
            // Store the resolve function
            window.dialogResolve = resolve;
        });
    },
    
    // Close dialog
    closeDialog(dialogId, result) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.remove();
            if (window.dialogResolve) {
                window.dialogResolve(result);
                delete window.dialogResolve;
            }
        }
    }
};

// File download helper function
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
