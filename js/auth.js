// Authentication Logic

class Auth {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupForms();
        this.checkRegistrationMode();
        this.setupPasswordToggle();
        this.setupTermsValidation();
    }
    
    setupForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }
    
    checkRegistrationMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('register') === 'true') {
            this.showRegisterForm();
        }
    }
    
    showRegisterForm() {
        const loginForm = document.querySelector('.auth-form:not(.register-form)');
        const registerForm = document.querySelector('.register-form');
        
        if (loginForm && registerForm) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            
            // Update URL without reload
            window.history.pushState({}, '', '?register=true');
        }
    }
    
    showLoginForm() {
        const loginForm = document.querySelector('.auth-form:not(.register-form)');
        const registerForm = document.querySelector('.register-form');
        
        if (loginForm && registerForm) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            
            // Update URL without reload
            window.history.pushState({}, '', 'login.html');
        }
    }
    
    setupPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
    
    setupTermsValidation() {
        const agreeTerms = document.getElementById('agreeTerms');
        const agreeSEBI = document.getElementById('agreeSEBI');
        const submitButtons = document.querySelectorAll('button[type="submit"]');
        
        if (agreeTerms && agreeSEBI && submitButtons) {
            const validateTerms = () => {
                const isValid = agreeTerms.checked && agreeSEBI.checked;
                submitButtons.forEach(button => {
                    button.disabled = !isValid;
                });
            };
            
            agreeTerms.addEventListener('change', validateTerms);
            agreeSEBI.addEventListener('change', validateTerms);
            
            // Initial validation
            validateTerms();
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const loader = app.showLoading();
        
        try {
            const email = form.querySelector('#email').value;
            const password = form.querySelector('#password').value;
            const remember = form.querySelector('#remember')?.checked || false;
            
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password,
                    remember: remember
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                app.showToast('Login successful!', 'success');
                
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1000);
                
            } else {
                app.showToast(data.message || 'Login failed', 'error');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            app.showToast('Network error. Please try again.', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const form = e.target;
        const loader = app.showLoading();
        
        try {
            const formData = {
                action: 'register',
                email: form.querySelector('#email').value,
                password: form.querySelector('#password').value,
                name: form.querySelector('#fullName').value,
                phone: form.querySelector('#phone').value || '',
                company: form.querySelector('#company').value || '',
                experience: form.querySelector('#experience')?.value || 'beginner'
            };
            
            // Validate password confirmation
            const confirmPassword = form.querySelector('#confirmPassword');
            if (confirmPassword && confirmPassword.value !== formData.password) {
                throw new Error('Passwords do not match');
            }
            
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                app.showToast('Registration successful! Starting your free trial...', 'success');
                
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
                
            } else {
                app.showToast(data.message || 'Registration failed', 'error');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            app.showToast(error.message || 'Registration failed', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    async handleLogout() {
        const confirmed = await app.confirmDialog('Are you sure you want to logout?');
        
        if (confirmed) {
            const loader = app.showLoading();
            
            try {
                const response = await fetch('/php/auth.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'logout' })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    app.showToast('Logged out successfully', 'success');
                    
                    // Redirect to login page
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 1000);
                }
                
            } catch (error) {
                console.error('Logout error:', error);
                app.showToast('Logout failed', 'error');
            } finally {
                app.hideLoading(loader);
            }
        }
    }
    
    async handleForgotPassword(email) {
        const loader = app.showLoading();
        
        try {
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'forgot_password',
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                app.showToast('Password reset instructions sent to your email', 'success');
            } else {
                app.showToast(data.message || 'Failed to send reset email', 'error');
            }
            
        } catch (error) {
            console.error('Forgot password error:', error);
            app.showToast('Network error. Please try again.', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
    
    // Setup logout button if exists
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.handleLogout();
        });
    }
    
    // Setup toggle between login and register forms
    const toggleLinks = document.querySelectorAll('[data-toggle-form]');
    toggleLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.toggleForm;
            
            if (target === 'register') {
                auth.showRegisterForm();
            } else {
                auth.showLoginForm();
            }
        });
    });
    
    // Forgot password handler
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (forgotPasswordBtn && forgotPasswordModal) {
        forgotPasswordBtn.addEventListener('click', () => {
            forgotPasswordModal.style.display = 'block';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.style.display = 'none';
            }
        });
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = forgotPasswordForm.querySelector('#forgotEmail').value;
            auth.handleForgotPassword(email);
            forgotPasswordModal.style.display = 'none';
        });
    }
});
