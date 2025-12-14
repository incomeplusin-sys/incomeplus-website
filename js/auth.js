// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're in registration mode
    const urlParams = new URLSearchParams(window.location.search);
    const isRegister = urlParams.has('register');
    
    const loginForm = document.querySelector('.auth-form');
    const registerForm = document.querySelector('.register-form');
    
    if (isRegister && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    
    // Toggle between login and register
    document.querySelectorAll('[href*="register"]').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.getAttribute('href').includes('#')) {
                return; // Allow normal navigation
            }
            
            e.preventDefault();
            loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    });
    
    // Password strength checker for registration
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            updatePasswordStrengthIndicator(strength);
        });
    }
    
    // Form submission
    const loginFormEl = document.getElementById('loginForm');
    if (loginFormEl) {
        loginFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Basic validation
            if (!email || !password) {
                showAuthError('Please fill in all fields');
                return;
            }
            
            if (!isValidEmail(email)) {
                showAuthError('Please enter a valid email address');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;
            
            try {
                // Simulate API call - Replace with actual API call
                const response = await mockLoginAPI(email, password);
                
                if (response.success) {
                    // Store user data in localStorage (in real app, use secure methods)
                    localStorage.setItem('user', JSON.stringify(response.user));
                    localStorage.setItem('token', response.token);
                    
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    showAuthError(response.message);
                }
            } catch (error) {
                showAuthError('Login failed. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Registration form handling
    const registerFormEl = document.querySelector('#registerForm');
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate all required checkboxes
            const requiredCheckboxes = this.querySelectorAll('input[type="checkbox"][required]');
            let allChecked = true;
            
            requiredCheckboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    allChecked = false;
                    checkbox.parentElement.style.color = '#fc5c65';
                } else {
                    checkbox.parentElement.style.color = '';
                }
            });
            
            if (!allChecked) {
                showAuthError('Please agree to all terms and conditions');
                return;
            }
            
            // Get form data
            const formData = {
                name: document.getElementById('regName')?.value,
                email: document.getElementById('regEmail')?.value,
                password: document.getElementById('regPassword')?.value,
                phone: document.getElementById('regPhone')?.value,
                company: document.getElementById('regCompany')?.value,
                experience: document.getElementById('regExperience')?.value
            };
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitBtn.disabled = true;
            
            try {
                const response = await mockRegisterAPI(formData);
                
                if (response.success) {
                    showAuthSuccess('Account created successfully! Redirecting to dashboard...');
                    
                    // Store user data
                    localStorage.setItem('user', JSON.stringify(response.user));
                    localStorage.setItem('token', response.token);
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                } else {
                    showAuthError(response.message);
                }
            } catch (error) {
                showAuthError('Registration failed. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Forgot password functionality
    const forgotPasswordLink = document.querySelector('a[href="#forgot"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
});

// Helper functions
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkPasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return score;
}

function updatePasswordStrengthIndicator(strength) {
    let indicator = document.getElementById('password-strength');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'password-strength';
        indicator.className = 'password-strength';
        
        const passwordInput = document.querySelector('input[type="password"]');
        if (passwordInput) {
            passwordInput.parentElement.appendChild(indicator);
        }
    }
    
    let text = 'Weak';
    let color = '#fc5c65';
    
    if (strength >= 4) {
        text = 'Strong';
        color = '#10b981';
    } else if (strength >= 3) {
        text = 'Good';
        color = '#f59e0b';
    }
    
    indicator.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill" style="width: ${strength * 25}%; background: ${color};"></div>
        </div>
        <span class="strength-text" style="color: ${color};">${text}</span>
    `;
}

function showAuthError(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.auth-error');
    if (existingError) existingError.remove();
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#auth-error-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-error-styles';
        style.textContent = `
            .auth-error {
                background: rgba(252, 92, 101, 0.1);
                border-left: 4px solid #fc5c65;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fc5c65;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        authForm.insertBefore(errorDiv, authForm.firstChild);
    }
}

function showAuthSuccess(message) {
    // Remove existing success messages
    const existingSuccess = document.querySelector('.auth-success');
    if (existingSuccess) existingSuccess.remove();
    
    const successDiv = document.createElement('div');
    successDiv.className = 'auth-success';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#auth-success-styles')) {
        const style = document.createElement('style');
        style.id = 'auth-success-styles';
        style.textContent = `
            .auth-success {
                background: rgba(16, 185, 129, 0.1);
                border-left: 4px solid #10b981;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #10b981;
                animation: slideIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        authForm.insertBefore(successDiv, authForm.firstChild);
    }
}

// Mock API functions (Replace with actual API calls)
async function mockLoginAPI(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return {
        success: true,
        user: {
            id: 1,
            email: email,
            name: 'Test User',
            subscription_type: 'trial',
            subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        token: 'mock-jwt-token'
    };
}

async function mockRegisterAPI(formData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock response
    return {
        success: true,
        user: {
            id: 2,
            email: formData.email,
            name: formData.name,
            subscription_type: 'trial',
            subscription_start: new Date().toISOString().split('T')[0],
            subscription_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            trial_used: true
        },
        token: 'mock-jwt-token-new'
    };
}

function showForgotPasswordModal() {
    const modalHTML = `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> Reset Password</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Enter your email address to receive a password reset link.</p>
                    <div class="form-group">
                        <input type="email" id="resetEmail" placeholder="Enter your email" class="modal-input">
                    </div>
                    <button id="sendResetLink" class="btn-auth">
                        Send Reset Link
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles
    if (!document.querySelector('#modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .modal-content {
                background: white;
                border-radius: 15px;
                width: 90%;
                max-width: 400px;
                overflow: hidden;
            }
            
            .modal-header {
                background: linear-gradient(135deg, #4f46e5, #7c3aed);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                font-family: 'Poppins', sans-serif;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .close-modal {
                background: none;
                border: none;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                line-height: 1;
            }
            
            .modal-body {
                padding: 30px;
            }
            
            .modal-input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                margin: 15px 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close modal functionality
    const modal = document.querySelector('.modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Send reset link functionality
    const sendBtn = modal.querySelector('#sendResetLink');
    sendBtn.addEventListener('click', () => {
        const email = modal.querySelector('#resetEmail').value;
        
        if (!isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        sendBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            alert('Password reset link has been sent to your email.');
            modal.remove();
        }, 1000);
    });
}
