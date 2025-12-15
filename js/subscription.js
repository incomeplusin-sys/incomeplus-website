// Subscription Management

class SubscriptionManager {
    constructor() {
        this.selectedPlan = null;
        this.paymentInProgress = false;
        this.init();
    }
    
    init() {
        this.loadPlans();
        this.setupEventListeners();
        this.updateSubscriptionInfo();
    }
    
    async loadPlans() {
        try {
            const response = await fetch('/php/subscription.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'get_plans' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.plans = data.plans;
                this.renderPlans(data.plans);
            }
        } catch (error) {
            console.error('Failed to load plans:', error);
            this.renderPlans(this.getDefaultPlans());
        }
    }
    
    getDefaultPlans() {
        return {
            monthly: {
                name: 'Monthly Plan',
                price: 999,
                period: 'month',
                features: [
                    'All 10 advanced scanners',
                    'Real-time market data',
                    'Historical backtesting',
                    'Results database storage',
                    'Email & SMS alerts',
                    'Priority support'
                ]
            },
            quarterly: {
                name: 'Quarterly Plan',
                price: 2699,
                period: '3 months',
                savings: 10,
                features: [
                    'Everything in Monthly',
                    '20% more daily scans',
                    'Extended backtesting period',
                    'Advanced analytics'
                ]
            },
            annual: {
                name: 'Annual Plan',
                price: 9999,
                period: 'year',
                savings: 17,
                features: [
                    'Everything in Quarterly',
                    'Custom scanner development',
                    'API access',
                    'Dedicated account manager',
                    'Priority feature requests'
                ]
            }
        };
    }
    
    renderPlans(plans) {
        const container = document.querySelector('.pricing-cards');
        if (!container) return;
        
        let html = '';
        
        Object.entries(plans).forEach(([planId, plan]) => {
            const isPopular = planId === 'quarterly';
            
            html += `
                <div class="pricing-card ${isPopular ? 'popular' : ''}">
                    ${isPopular ? '<div class="popular-badge">Most Popular</div>' : ''}
                    
                    <div class="pricing-header">
                        <h3>${plan.name}</h3>
                        <div class="price">₹${plan.price.toLocaleString()}</div>
                        <div class="period">per ${plan.period}</div>
                        ${plan.savings ? `<div class="savings">Save ${plan.savings}%</div>` : ''}
                    </div>
                    
                    <ul class="features-list">
                        ${plan.features.map(feature => `
                            <li><i class="fas fa-check"></i> ${feature}</li>
                        `).join('')}
                    </ul>
                    
                    <button class="btn-pricing ${isPopular ? 'btn-primary' : ''}" 
                            data-plan="${planId}" onclick="subscription.selectPlan('${planId}')">
                        Choose ${plan.name.split(' ')[0]}
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    selectPlan(planId) {
        this.selectedPlan = this.plans[planId];
        this.selectedPlan.id = planId;
        
        this.showPaymentSection();
        this.updateSelectedPlanInfo();
    }
    
    showPaymentSection() {
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection) {
            paymentSection.style.display = 'block';
            
            // Scroll to payment section
            setTimeout(() => {
                paymentSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }
    
    updateSelectedPlanInfo() {
        if (!this.selectedPlan) return;
        
        const nameElement = document.getElementById('selectedPlanName');
        const priceElement = document.getElementById('selectedPlanPrice');
        const periodElement = document.getElementById('selectedPlanPeriod');
        
        if (nameElement) nameElement.textContent = this.selectedPlan.name;
        if (priceElement) priceElement.textContent = `Price: ₹${this.selectedPlan.price.toLocaleString()}`;
        if (periodElement) periodElement.textContent = `Billing Period: ${this.selectedPlan.period}`;
    }
    
    async processPayment(paymentData) {
        if (this.paymentInProgress) return;
        
        this.paymentInProgress = true;
        const loader = app.showLoading();
        
        try {
            // Step 1: Create order
            const orderResponse = await fetch('/php/subscription.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_order',
                    plan_type: this.selectedPlan.id
                })
            });
            
            const orderData = await orderResponse.json();
            
            if (!orderData.success) {
                throw new Error(orderData.message || 'Failed to create order');
            }
            
            // Step 2: Process payment
            const paymentResult = await this.processPaymentGateway(orderData.payment_data);
            
            // Step 3: Verify payment
            const verifyResponse = await fetch('/php/subscription.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'verify_payment',
                    payment_id: paymentResult.payment_id,
                    order_id: paymentResult.order_id,
                    signature: paymentResult.signature,
                    order_db_id: orderData.order.db_id
                })
            });
            
            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
                app.showToast('Payment successful! Subscription activated.', 'success');
                
                // Update user info
                await app.checkSession();
                
                // Redirect to dashboard after delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 2000);
                
            } else {
                throw new Error(verifyData.message || 'Payment verification failed');
            }
            
        } catch (error) {
            console.error('Payment error:', error);
            app.showToast(error.message || 'Payment failed. Please try again.', 'error');
        } finally {
            this.paymentInProgress = false;
            app.hideLoading(loader);
        }
    }
    
    async processPaymentGateway(paymentData) {
        // This is where you integrate with Razorpay/Stripe/Other payment gateway
        // For demo purposes, we'll simulate a successful payment
        
        return new Promise((resolve, reject) => {
            if (window.Razorpay) {
                // Real Razorpay integration
                const options = {
                    key: paymentData.key,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    name: paymentData.name,
                    description: paymentData.description,
                    order_id: paymentData.order_id,
                    handler: function(response) {
                        resolve(response);
                    },
                    prefill: paymentData.prefill,
                    theme: paymentData.theme
                };
                
                const rzp = new Razorpay(options);
                rzp.open();
                
            } else {
                // Mock payment for demo
                setTimeout(() => {
                    resolve({
                        payment_id: 'mock_payment_' + Date.now(),
                        order_id: paymentData.order_id,
                        signature: 'mock_signature_' + Date.now()
                    });
                }, 1500);
            }
        });
    }
    
    async cancelSubscription() {
        const confirmed = await app.confirmDialog(
            'Are you sure you want to cancel your subscription? You will lose access to premium features.'
        );
        
        if (!confirmed) return;
        
        const loader = app.showLoading();
        
        try {
            const response = await fetch('/php/subscription.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'cancel_subscription' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                app.showToast('Subscription cancelled successfully', 'success');
                
                // Update user info
                await app.checkSession();
                
                // Refresh page after delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
                
            } else {
                throw new Error(data.message || 'Failed to cancel subscription');
            }
            
        } catch (error) {
            console.error('Cancel subscription error:', error);
            app.showToast(error.message || 'Failed to cancel subscription', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    async updateSubscriptionInfo() {
        try {
            const response = await fetch('/php/subscription.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'get_current_subscription' })
            });
            
            const data = await response.json();
            
            if (data.success && data.subscription) {
                this.updateSubscriptionUI(data.subscription);
            }
        } catch (error) {
            console.error('Failed to load subscription info:', error);
        }
    }
    
    updateSubscriptionUI(subscription) {
        // Update active plan info
        const planNameElement = document.getElementById('activePlanName');
        const planDescElement = document.getElementById('activePlanDesc');
        const planStatusElement = document.getElementById('planStatus');
        const renewalElement = document.getElementById('renewalDate');
        
        if (planNameElement) {
            const planName = subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1);
            planNameElement.textContent = planName + ' Plan';
        }
        
        if (planDescElement) {
            planDescElement.textContent = this.getPlanDescription(subscription.plan_type);
        }
        
        if (planStatusElement) {
            planStatusElement.textContent = subscription.status;
            planStatusElement.className = `status-badge ${subscription.status}`;
        }
        
        if (renewalElement && subscription.end_date) {
            const endDate = new Date(subscription.end_date);
            renewalElement.textContent = `Renews on: ${endDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })}`;
        }
    }
    
    getPlanDescription(planType) {
        const descriptions = {
            'trial': 'Access to all scanners with real-time data',
            'monthly': 'Full access to all premium features',
            'quarterly': 'Extended features with quarterly savings',
            'annual': 'Complete access with maximum savings'
        };
        return descriptions[planType] || 'Premium scanner access';
    }
    
    applyCoupon(couponCode) {
        // Implement coupon validation and application
        const validCoupons = {
            'WELCOME10': 10,
            'SCANNER20': 20,
            'TRADER25': 25
        };
        
        if (validCoupons[couponCode]) {
            const discount = validCoupons[couponCode];
            const originalPrice = this.selectedPlan.price;
            const discountedPrice = originalPrice * (1 - discount / 100);
            
            app.showToast(`Coupon applied! ${discount}% discount`, 'success');
            return discountedPrice;
        } else {
            app.showToast('Invalid coupon code', 'error');
            return null;
        }
    }
    
    setupEventListeners() {
        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePaymentFormSubmit(e);
            });
        }
        
        // Cancel subscription button
        const cancelBtn = document.getElementById('cancelSubscription');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelSubscription());
        }
        
        // Upgrade plan buttons
        const upgradeBtns = document.querySelectorAll('[data-action="upgrade"]');
        upgradeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const planId = btn.dataset.plan;
                if (planId) this.selectPlan(planId);
            });
        });
        
        // Coupon application
        const couponBtn = document.getElementById('applyCoupon');
        if (couponBtn) {
            couponBtn.addEventListener('click', () => {
                const couponInput = document.getElementById('coupon');
                if (couponInput && couponInput.value) {
                    this.applyCoupon(couponInput.value);
                }
            });
        }
    }
    
    async handlePaymentFormSubmit(e) {
        const form = e.target;
        
        // Validate form
        if (!this.validatePaymentForm(form)) {
            return;
        }
        
        // Get payment data
        const paymentData = {
            cardName: form.querySelector('#cardName').value,
            cardNumber: form.querySelector('#cardNumber').value,
            expiryDate: form.querySelector('#expiryDate').value,
            cvv: form.querySelector('#cvv').value
        };
        
        // Process payment
        await this.processPayment(paymentData);
    }
    
    validatePaymentForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                app.showInputError(input, 'This field is required');
            } else {
                app.clearInputError(input);
                
                // Validate card number
                if (input.id === 'cardNumber') {
                    const cardNumber = input.value.replace(/\s/g, '');
                    if (!this.validateCardNumber(cardNumber)) {
                        isValid = false;
                        app.showInputError(input, 'Invalid card number');
                    }
                }
                
                // Validate expiry date
                if (input.id === 'expiryDate') {
                    if (!this.validateExpiryDate(input.value)) {
                        isValid = false;
                        app.showInputError(input, 'Invalid expiry date (MM/YY)');
                    }
                }
                
                // Validate CVV
                if (input.id === 'cvv') {
                    if (!/^\d{3,4}$/.test(input.value)) {
                        isValid = false;
                        app.showInputError(input, 'Invalid CVV');
                    }
                }
            }
        });
        
        return isValid;
    }
    
    validateCardNumber(cardNumber) {
        // Simple Luhn algorithm validation
        let sum = 0;
        let isEven = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i), 10);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return (sum % 10) === 0;
    }
    
    validateExpiryDate(expiry) {
        if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
        
        const [month, year] = expiry.split('/').map(num => parseInt(num, 10));
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (month < 1 || month > 12) return false;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        
        return true;
    }
}

// Initialize subscription manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.subscription-content') || document.querySelector('.pricing-cards')) {
        window.subscription = new SubscriptionManager();
    }
});
