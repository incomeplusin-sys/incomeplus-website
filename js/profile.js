// Profile Management
class ProfileManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadProfileData();
        this.setupEventListeners();
    }
    
    loadProfileData() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Update form fields
        document.getElementById('fullName').value = user.fullName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('company').value = user.company || '';
        document.getElementById('experienceLevel').value = user.experienceLevel || 'beginner';
        
        // Update avatar with initials
        this.updateAvatar(user.fullName);
        
        // Update displayed name
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = user.fullName || 'User';
        }
    }
    
    updateAvatar(fullName) {
        const avatar = document.getElementById('profileAvatar');
        if (!avatar || !fullName) return;
        
        // Create initials
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        // Replace icon with initials
        avatar.innerHTML = initials;
        avatar.style.background = this.getAvatarColor(fullName);
        avatar.style.color = 'white';
        avatar.style.fontWeight = '600';
        avatar.style.fontSize = '1rem';
    }
    
    getAvatarColor(str) {
        // Generate consistent color based on string
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            '#4f46e5', '#7c3aed', '#10b981', '#f59e0b', 
            '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }
    
    setupEventListeners() {
        // Personal info form
        const personalForm = document.getElementById('personalInfoForm');
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePersonalInfo();
            });
        }
        
        // Password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }
        
        // Notification preferences form
        const notificationForm = document.getElementById('notificationForm');
        if (notificationForm) {
            notificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotificationPreferences();
            });
        }
    }
    
    async updatePersonalInfo() {
        const formData = {
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            company: document.getElementById('company').value,
            experienceLevel: document.getElementById('experienceLevel').value
        };
        
        // Validation
        if (!formData.fullName) {
            this.showNotification('Full name is required', 'error');
            return;
        }
        
        const submitBtn = document.querySelector('#personalInfoForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update user data
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            Object.assign(user, formData);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update UI
            this.updateAvatar(user.fullName);
            document.getElementById('profileName').textContent = user.fullName;
            
            this.showNotification('Profile updated successfully', 'success');
            
        } catch (error) {
            console.error('Update error:', error);
            this.showNotification('Failed to update profile', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Please fill all password fields', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }
        
        const submitBtn = document.querySelector('#passwordForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // In real app, verify current password first
            // For demo, just simulate success
            
            // Clear form
            document.getElementById('passwordForm').reset();
            
            this.showNotification('Password changed successfully', 'success');
            
        } catch (error) {
            console.error('Password change error:', error);
            this.showNotification('Failed to change password', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async saveNotificationPreferences() {
        const preferences = {
            emailAlerts: document.getElementById('emailAlerts').checked,
            smsAlerts: document.getElementById('smsAlerts').checked,
            weeklyReports: document.getElementById('weeklyReports').checked,
            marketUpdates: document.getElementById('marketUpdates').checked
        };
        
        const submitBtn = document.querySelector('#notificationForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Save to localStorage
            localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
            
            this.showNotification('Preferences saved successfully', 'success');
            
        } catch (error) {
            console.error('Save preferences error:', error);
            this.showNotification('Failed to save preferences', 'error');
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
    window.profileManager = new ProfileManager();
});

// Global functions for account management
function exportData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const data = {
        user: user,
        savedResults: JSON.parse(localStorage.getItem('savedResults') || '[]'),
        notificationPreferences: JSON.parse(localStorage.getItem('notificationPreferences') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incomeplus-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    alert('Data exported successfully!');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your data. Type DELETE to confirm:')) {
            // Clear all user data
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('savedResults');
            localStorage.removeItem('notificationPreferences');
            
            alert('Account deleted successfully. Redirecting to home page.');
            window.location.href = 'index.html';
        }
    }
}
