// Profile Page Functionality

class ProfileManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.setupPasswordStrength();
        this.setupModals();
    }
    
    async loadUserData() {
        try {
            // Load user data
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'check_session' })
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                this.populateUserData(data.user);
                this.loadUserStats();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.showToast('Failed to load profile data', 'error');
        }
    }
    
    populateUserData(user) {
        // Personal Information
        document.getElementById('fullName').value = user.full_name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('company').value = user.company || '';
        
        // Experience Level
        const experienceSelect = document.getElementById('experienceLevel');
        if (experienceSelect) {
            experienceSelect.value = user.experience_level || 'beginner';
        }
        
        // Update sidebar
        document.getElementById('sidebarUserName').textContent = user.full_name || user.email.split('@')[0];
        document.getElementById('sidebarUserPlan').textContent = user.subscription_type || 'Trial';
        
        // Update top bar
        document.getElementById('userName').textContent = user.full_name || user.email.split('@')[0];
        
        // Update member since
        const memberSinceElement = document.getElementById('memberSince');
        if (memberSinceElement && user.created_at) {
            const joinDate = new Date(user.created_at);
            memberSinceElement.textContent = joinDate.toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric'
            });
        }
    }
    
    async loadUserStats() {
        try {
            const response = await fetch('/php/scanner.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.stats) {
                document.getElementById('totalScans').textContent = data.stats.total_scans || 0;
                document.getElementById('accuracyRate').textContent = data.stats.accuracy_rate || '0%';
            }
        } catch (error) {
            console.error('Failed to load user stats:', error);
        }
    }
    
    setupEventListeners() {
        // Personal Information Form
        const personalInfoForm = document.getElementById('personalInfoForm');
        if (personalInfoForm) {
            personalInfoForm.addEventListener('submit', (e) => this.handlePersonalInfoSubmit(e));
        }
        
        // Cancel Personal Info
        const cancelPersonalInfo = document.getElementById('cancelPersonalInfo');
        if (cancelPersonalInfo) {
            cancelPersonalInfo.addEventListener('click', () => this.resetPersonalInfoForm());
        }
        
        // Password Form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
        
        // Cancel Password
        const cancelPassword = document.getElementById('cancelPassword');
        if (cancelPassword) {
            cancelPassword.addEventListener('click', () => this.resetPasswordForm());
        }
        
        // Notification Form
        const notificationForm = document.getElementById('notificationForm');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => this.handleNotificationSubmit(e));
        }
        
        // Cancel Notifications
        const cancelNotifications = document.getElementById('cancelNotifications');
        if (cancelNotifications) {
            cancelNotifications.addEventListener('click', () => this.resetNotificationForm());
        }
        
        // Security Actions
        document.getElementById('viewSessions')?.addEventListener('click', () => this.showSessionsModal());
        document.getElementById('viewLoginHistory')?.addEventListener('click', () => this.showLoginHistory());
        document.getElementById('setup2FA')?.addEventListener('click', () => this.show2FAModal());
        document.getElementById('exportData')?.addEventListener('click', () => this.exportUserData());
        
        // Danger Zone Actions
        document.getElementById('deactivateAccount')?.addEventListener('click', () => this.deactivateAccount());
        document.getElementById('deleteAccount')?.addEventListener('click', () => this.deleteAccount());
        
        // Password toggle
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const input = e.target.closest('.password-input').querySelector('input');
                const icon = e.target.querySelector('i');
                
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
        
        // Confidence slider
        const confidenceSlider = document.getElementById('minConfidenceAlert');
        const confidenceValue = document.getElementById('confidenceValue');
        
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = `${e.target.value}%`;
            });
        }
    }
    
    setupPasswordStrength() {
        const passwordInput = document.getElementById('newPassword');
        const strengthBar = document.getElementById('passwordStrength');
        const strengthLabel = document.getElementById('passwordStrengthLabel');
        
        if (passwordInput && strengthBar && strengthLabel) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                
                // Update strength bar
                strengthBar.style.width = `${strength.score * 20}%`;
                
                // Update color based on strength
                if (strength.score <= 1) {
                    strengthBar.style.background = '#ef4444'; // Red
                    strengthLabel.textContent = 'Weak';
                } else if (strength.score <= 3) {
                    strengthBar.style.background = '#f59e0b'; // Yellow
                    strengthLabel.textContent = 'Fair';
                } else if (strength.score <= 4) {
                    strengthBar.style.background = '#10b981'; // Green
                    strengthLabel.textContent = 'Good';
                } else {
                    strengthBar.style.background = '#059669'; // Dark Green
                    strengthLabel.textContent = 'Strong';
                }
            });
        }
    }
    
    calculatePasswordStrength(password) {
        let score = 0;
        
        // Length check
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        
        // Character variety
        if (/[a-z]/.test(password)) score++; // Lowercase
        if (/[A-Z]/.test(password)) score++; // Uppercase
        if (/[0-9]/.test(password)) score++; // Numbers
        if (/[^a-zA-Z0-9]/.test(password)) score++; // Special characters
        
        return { score: Math.min(score, 5) };
    }
    
    setupModals() {
        // Close modals
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').classList.remove('active');
            });
        });
        
        // Close modal when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Revoke all sessions
        document.getElementById('revokeAllSessions')?.addEventListener('click', () => {
            this.revokeAllSessions();
        });
        
        // Verify 2FA
        document.getElementById('verify2FA')?.addEventListener('click', () => {
            this.verify2FACode();
        });
        
        // Download backup codes
        document.getElementById('downloadBackupCodes')?.addEventListener('click', () => {
            this.downloadBackupCodes();
        });
    }
    
    async handlePersonalInfoSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const loader = app.showLoading();
        
        try {
            const formData = {
                action: 'update_profile',
                full_name: form.querySelector('#fullName').value,
                phone: form.querySelector('#phone').value,
                company: form.querySelector('#company').value,
                experience: form.querySelector('#experienceLevel').value
            };
            
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Profile updated successfully', 'success');
                await this.loadUserData(); // Refresh data
            } else {
                this.showToast(data.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showToast('Failed to update profile', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    resetPersonalInfoForm() {
        // Reload original data
        this.loadUserData();
        this.showToast('Changes discarded', 'info');
    }
    
    async handlePasswordChange(e) {
        e.preventDefault();
        
        const form = e.target;
        const currentPassword = form.querySelector('#currentPassword').value;
        const newPassword = form.querySelector('#newPassword').value;
        const confirmPassword = form.querySelector('#confirmPassword').value;
        
        // Validation
        if (newPassword.length < 8) {
            this.showToast('Password must be at least 8 characters', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        
        const loader = app.showLoading();
        
        try {
            const response = await fetch('/php/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'change_password',
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showToast('Password changed successfully', 'success');
                this.resetPasswordForm();
            } else {
                this.showToast(data.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showToast('Failed to change password', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    resetPasswordForm() {
        const form = document.getElementById('passwordForm');
        form.reset();
        
        // Reset strength indicator
        const strengthBar = document.getElementById('passwordStrength');
        const strengthLabel = document.getElementById('passwordStrengthLabel');
        
        if (strengthBar) strengthBar.style.width = '0%';
        if (strengthLabel) strengthLabel.textContent = 'Password strength';
        
        this.showToast('Password form reset', 'info');
    }
    
    async handleNotificationSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const loader = app.showLoading();
        
        try {
            const notificationData = {
                email_scan_results: form.querySelector('#emailScanResults').checked,
                email_daily_summary: form.querySelector('#emailDailySummary').checked,
                email_weekly_report: form.querySelector('#emailWeeklyReport').checked,
                email_product_updates: form.querySelector('#emailProductUpdates').checked,
                email_promotional: form.querySelector('#emailPromotional').checked,
                sms_critical_alerts: form.querySelector('#smsCriticalAlerts').checked,
                sms_subscription: form.querySelector('#smsSubscription').checked,
                alert_frequency: form.querySelector('#alertFrequency').value,
                min_confidence_alert: form.querySelector('#minConfidenceAlert').value
            };
            
            // In production, save to server
            // For now, save to localStorage
            localStorage.setItem('notificationPreferences', JSON.stringify(notificationData));
            
            this.showToast('Notification preferences saved', 'success');
        } catch (error) {
            console.error('Notification save error:', error);
            this.showToast('Failed to save preferences', 'error');
        } finally {
            app.hideLoading(loader);
        }
    }
    
    resetNotificationForm() {
        // Reload saved preferences or reset to defaults
        const savedPreferences = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
        
        const form = document.getElementById('notificationForm');
        if (Object.keys(savedPreferences).length > 0) {
            // Restore saved preferences
            Object.keys(savedPreferences).forEach(key => {
                const element = form.querySelector(`#${key}`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = savedPreferences[key];
                    } else {
                        element.value = savedPreferences[key];
                    }
                }
            });
            this.showToast('Preferences restored', 'info');
        } else {
            // Reset to defaults
            form.reset();
            this.showToast('Preferences reset to defaults', 'info');
        }
    }
    
    showSessionsModal() {
        const modal = document.getElementById('sessionsModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    async revokeAllSessions() {
        const confirmed = await app.confirmDialog(
            'Are you sure you want to revoke all other sessions? You will be logged out from all other devices.'
        );
        
        if (confirmed) {
            const loader = app.showLoading();
            
            try {
                // In production, call API to revoke sessions
                // For demo, simulate success
                setTimeout(() => {
                    app.hideLoading(loader);
                    this.showToast('All other sessions revoked', 'success');
                    this.closeModal('sessionsModal');
                }, 1000);
            } catch (error) {
                console.error('Revoke sessions error:', error);
                this.showToast('Failed to revoke sessions', 'error');
                app.hideLoading(loader);
            }
        }
    }
    
    showLoginHistory() {
        // In production, fetch and display login history
        this.showToast('Login history feature coming soon', 'info');
    }
    
    show2FAModal() {
        const modal = document.getElementById('twoFAModal');
        if (modal) {
            modal.classList.add('active');
        }
    }
    
    verify2FACode() {
        const code = document.getElementById('twoFACode').value;
        
        if (!code || code.length !== 6) {
            this.showToast('Please enter a valid 6-digit code', 'error');
            return;
        }
        
        // In production, verify with server
        this.showToast('2FA verification successful', 'success');
        this.closeModal('twoFAModal');
    }
    
    downloadBackupCodes() {
        // Generate and download backup codes
        const codes = [
            'ABC123XYZ', 'DEF456UVW', 'GHI789RST',
            'JKL012OPQ', 'MNO345NOP', 'PQR678STU',
            'VWX901YZA', 'BCD234EFG', 'HIJ567KLM',
            'NOP890QRS'
        ];
        
        const content = `Volume Pattern Scanner - Backup Codes\n\n` +
                       `Save these codes in a secure place. Each code can be used once.\n\n` +
                       codes.join('\n') + `\n\nGenerated: ${new Date().toLocaleString()}`;
        
        app.downloadFile(content, 'backup_codes.txt', 'text/plain');
        this.showToast('Backup codes downloaded', 'success');
    }
    
    async exportUserData() {
        const confirmed = await app.confirmDialog(
            'Export all your data? This may take a few moments.'
        );
        
        if (confirmed) {
            const loader = app.showLoading();
            
            try {
                // In production, fetch user data from server
                // For demo, create sample data
                const userData = {
                    profile: {
                        name: document.getElementById('fullName').value,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('phone').value,
                        company: document.getElementById('company').value,
                        experience: document.getElementById('experienceLevel').value
                    },
                    preferences: JSON.parse(localStorage.getItem('notificationPreferences') || '{}'),
                    export_date: new Date().toISOString()
                };
                
                const content = JSON.stringify(userData, null, 2);
                app.downloadFile(content, `user_data_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
                
                this.showToast('Data exported successfully', 'success');
            } catch (error) {
                console.error('Export error:', error);
                this.showToast('Failed to export data', 'error');
            } finally {
                app.hideLoading(loader);
            }
        }
    }
    
    async deactivateAccount() {
        const confirmed = await app.confirmDialog(
            'Are you sure you want to deactivate your account?\n\n' +
            'Your account will be temporarily disabled. You can reactivate anytime by logging in.'
        );
        
        if (confirmed) {
            const loader = app.showLoading();
            
            try {
                // In production, call API to deactivate account
                setTimeout(() => {
                    app.hideLoading(loader);
                    this.showToast('Account deactivated successfully', 'success');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                }, 1500);
            } catch (error) {
                console.error('Deactivation error:', error);
                this.showToast('Failed to deactivate account', 'error');
                app.hideLoading(loader);
            }
        }
    }
    
    async deleteAccount() {
        const confirmed = await app.confirmDialog(
            '⚠️ WARNING: This action is irreversible!\n\n' +
            'All your data will be permanently deleted:\n' +
            '• Profile information\n' +
            '• Scan history\n' +
            '• Preferences\n' +
            '• Subscription data\n\n' +
            'Type "DELETE" to confirm:'
        );
        
        if (confirmed) {
            const userInput = prompt('Please type DELETE to confirm account deletion:');
            
            if (userInput === 'DELETE') {
                const loader = app.showLoading();
                
                try {
                    // In production, call API to delete account
                    setTimeout(() => {
                        app.hideLoading(loader);
                        this.showToast('Account deleted successfully', 'success');
                        setTimeout(() => {
                            window.location.href = '/index.html';
                        }, 2000);
                    }, 2000);
                } catch (error) {
                    console.error('Delete account error:', error);
                    this.showToast('Failed to delete account', 'error');
                    app.hideLoading(loader);
                }
            } else {
                this.showToast('Account deletion cancelled', 'info');
            }
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    showToast(message, type = 'info') {
        if (window.app && typeof app.showToast === 'function') {
            app.showToast(message, type);
        } else {
            // Fallback if app not loaded
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.profile-container') || window.location.pathname.includes('profile.html')) {
        window.profileManager = new ProfileManager();
    }
    
    // Load notification preferences on page load
    const loadNotificationPreferences = () => {
        const savedPreferences = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
        const form = document.getElementById('notificationForm');
        
        if (form && Object.keys(savedPreferences).length > 0) {
            Object.keys(savedPreferences).forEach(key => {
                const element = form.querySelector(`#${key}`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = savedPreferences[key];
                    } else {
                        element.value = savedPreferences[key];
                    }
                }
            });
        }
    };
    
    loadNotificationPreferences();
});
