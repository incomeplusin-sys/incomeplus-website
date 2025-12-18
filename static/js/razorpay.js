// Razorpay integration for IncomePlus

class RazorpayIntegration {
    constructor(options = {}) {
        this.options = options;
        this.razorpay = window.Razorpay || null;
        
        if (!this.razorpay) {
            console.error('Razorpay SDK not loaded');
            return;
        }
    }
    
    async createOrder(plan) {
        try {
            const response = await fetch('/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ plan })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create order');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }
    
    async verifyPayment(paymentData) {
        try {
            const response = await fetch('/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });
            
            if (!response.ok) {
                throw new Error('Payment verification failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
        }
    }
    
    openCheckout(plan, userData = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create order first
                const order = await this.createOrder(plan);
                
                const options = {
                    key: this.options.keyId,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'IncomePlus',
                    description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
                    order_id: order.id,
                    handler: async (response) => {
                        try {
                            // Verify payment
                            const verification = await this.verifyPayment({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            
                            if (verification.success) {
                                resolve(verification);
                            } else {
                                reject(new Error(verification.error || 'Payment verification failed'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    prefill: {
                        name: userData.name || '',
                        email: userData.email || '',
                        contact: userData.phone || ''
                    },
                    theme: {
                        color: '#2563eb'
                    },
                    modal: {
                        ondismiss: function() {
                            reject(new Error('Payment cancelled by user'));
                        }
                    }
                };
                
                // Add notes to options if present in order
                if (order.notes) {
                    options.notes = order.notes;
                }
                
                const razorpayInstance = new this.razorpay(options);
                razorpayInstance.open();
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Open subscription checkout for trial
    openTrialCheckout(plan, userData = {}) {
        const trialDays = plan === 'pro' ? 7 : 14;
        
        const options = {
            key: this.options.keyId,
            subscription_id: '', // Will be set after creating subscription
            name: 'IncomePlus',
            description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - ${trialDays} Day Free Trial`,
            prefill: {
                name: userData.name || '',
                email: userData.email || '',
                contact: userData.phone || ''
            },
            theme: {
                color: '#2563eb'
            },
            handler: async (response) => {
                // Handle trial subscription response
                console.log('Trial subscription response:', response);
                
                // Redirect to dashboard or show success message
                window.location.href = '/dashboard?trial_started=true';
            },
            modal: {
                ondismiss: function() {
                    console.log('Trial subscription cancelled');
                }
            }
        };
        
        const razorpayInstance = new this.razorpay(options);
        razorpayInstance.open();
    }
}

// Initialize Razorpay integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Checkout buttons
    const checkoutButtons = document.querySelectorAll('[data-checkout]');
    
    checkoutButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const plan = this.dataset.plan;
            const isTrial = this.dataset.trial === 'true';
            
            // Get user data if available
            const userData = {
                email: document.getElementById('user-email')?.value || '',
                phone: document.getElementById('user-phone')?.value || ''
            };
            
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
            this.disabled = true;
            
            try {
                const razorpay = new RazorpayIntegration({
                    keyId: window.RAZORPAY_KEY_ID
                });
                
                if (isTrial) {
                    await razorpay.openTrialCheckout(plan, userData);
                } else {
                    await razorpay.openCheckout(plan, userData);
                }
                
                // Show success message
                showNotification('Payment successful! Redirecting to dashboard...', 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/dashboard?payment_success=true';
                }, 2000);
                
            } catch (error) {
                console.error('Checkout error:', error);
                
                // Reset button state
                this.innerHTML = originalText;
                this.disabled = false;
                
                // Show error message
                showNotification(error.message || 'Payment failed. Please try again.', 'error');
            }
        });
    });
    
    // Subscription management
    const manageSubscriptionBtn = document.getElementById('manage-subscription');
    if (manageSubscriptionBtn) {
        manageSubscriptionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Open Razorpay customer portal
            const razorpay = new RazorpayIntegration({
                keyId: window.RAZORPAY_KEY_ID
            });
            
            // In production, this would open the Razorpay customer portal
            // For now, redirect to a subscription management page
            window.location.href = '/subscription/manage';
        });
    }
});

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-600' :
        type === 'error' ? 'bg-red-600' :
        type === 'warning' ? 'bg-yellow-600' :
        'bg-blue-600'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' :
                'fa-info-circle'
            } mr-3"></i>
            <span>${message}</span>
            <button class="ml-4 text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Export for use in other modules
window.RazorpayIntegration = RazorpayIntegration;
