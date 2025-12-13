// Subscription Management
class SubscriptionManager {
    constructor() {
        this.plans = {
            monthly: {
                name: 'Monthly Plan',
                price: 999,
                period: 'month',
                features: [
                    'All 10 professional scanners',
                    'Real-time market data',
                    'Advanced backtesting',
                    'Results database (1 year)',
                    'Email & SMS alerts',
                    'Priority support'
                ]
            },
            quarterly: {
                name: 'Quarterly Plan',
                price: 2699,
                period: '3 months',
                savings: 298,
                features: [
                    'Everything in Monthly',
                    'Extended results history',
                    'Custom scanner presets',
                    'Advanced analytics',
                    'Priority API access'
                ]
            },
            annual: {
                name: 'Annual Plan',
                price: 9999,
                period: 'year',
                savings: 1989,
                features: [
                    'Everything in Quarterly',
                    'Unlimited results storage',
                    'Custom scanner requests',
                    'API integration',
                    'Dedicated support',
                    'Training sessions'
                ]
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadUserSubscription();
        this.setupEventListeners();
    }
    
    loadUserSubscription() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Update current plan display
        const planName = document.getElementById('activePlanName');
        const planStatus = document.getElementById('planStatus');
        const renewalDate = document.getElementById('renewalDate');
        
        if (user.subscription) {
            if (planName) planName.textContent = user.subscription === 'trial' ? 'Free Trial' : this.plans[user.subscription]?.name || 'Pro Plan';
            if (planStatus) planStatus.textContent = user.subscription === 'trial' ? 'Trial' : 'Active';
            if (renewalDate) renewalDate.textContent = `Renews on: ${user.trialEnd || '--'}`;
        }
    }
    
    setupEventListeners() {
        // Plan selection
        document.querySelectorAll('.btn-pricing').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planType = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 
                                e.target.closest('button').getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (planType) this.selectPlan(planType);
            });
        });
        
        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }
        
        // Upgrade button
        const upgradeBtn = document.querySelector('[onclick="upgradePlan()"]');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.upgradePlan());
        }
    }
    
    selectPlan(planType) {
        const plan = this.plans[planType];
        if (!plan) return;
        
        // Update selected plan display
        document.getElementById('selectedPlanName').textContent = plan.name;
        document.getElementById('selectedPlanPrice').textContent = `Price: ₹${plan.price}`;
        document.getElementById('selectedPlanPeriod').textContent = `Billing Period: ${plan.period}`;
        
        // Show payment section
        document.getElementById('paymentSection').style.display = 'block';
        
        // Scroll to payment section
        document.getElementById('paymentSection').scrollIntoView({ behavior: 'smooth' });
    }
    
    upgradePlan() {
        // Scroll to plans section
        document.querySelector('.available-plans').scrollIntoView({ behavior: 'smooth' });
    }
    
    async processPayment() {
        const cardName = document.getElementById('cardName').value;
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        
        // Basic validation
        if (!cardName || !cardNumber || !expiryDate || !cvv) {
            this.showNotification('Please fill all payment details', 'error');
            return;
        }
        
        if (!document.getElementById('agreeBilling').checked) {
            this.showNotification('Please agree to the billing terms', 'error');
            return;
        }
        
        const submitBtn = document.querySelector('#paymentForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get selected plan
            const planName = document.getElementById('selectedPlanName').textContent;
            const planType = Object.keys(this.plans).find(key => this.plans[key].name === planName);
            
            if (!planType) {
                throw new Error('Invalid plan selection');
            }
            
            // Update user subscription
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.subscription = planType;
            
            // Set subscription end date
            const today = new Date();
            let endDate = new Date(today);
            
            switch(planType) {
                case 'monthly':
                    endDate.setMonth(endDate.getMonth() + 1);
                    break;
                case 'quarterly':
                    endDate.setMonth(endDate.getMonth() + 3);
                    break;
                case 'annual':
                    endDate.setFullYear(endDate.getFullYear() + 1);
                    break;
            }
            
            user.subscriptionEnd = endDate.toISOString().split('T')[0];
            localStorage.setItem('user', JSON.stringify(user));
            
            // Show success
            this.showNotification('Payment successful! Subscription activated.', 'success');
            
            // Update UI
            this.loadUserSubscription();
            
            // Hide payment section
            document.getElementById('paymentSection').style.display = 'none';
            
            // Clear form
            document.getElementById('paymentForm').reset();
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Payment error:', error);
            this.showNotification('Payment failed: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
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
    window.subscriptionManager = new SubscriptionManager();
});
