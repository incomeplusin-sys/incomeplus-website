// Admin Panel Management
class AdminManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.loadUsers();
        this.setupEventListeners();
        this.updateStats();
    }
    
    async loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        // Show loading
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin"></i> Loading users...
                </td>
            </tr>
        `;
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo, generate sample users
            const sampleUsers = this.generateSampleUsers();
            
            // Display users
            this.displayUsers(sampleUsers);
            
        } catch (error) {
            console.error('Load users error:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 40px; color: #ef4444;">
                        <i class="fas fa-exclamation-circle"></i> Failed to load users
                    </td>
                </tr>
            `;
        }
    }
    
    generateSampleUsers() {
        const names = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Sarah Williams', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Lisa Miller'];
        const companies = ['Tech Corp', 'Finance Ltd', 'Trading Inc', 'Investment Co', 'Brokerage Firm'];
        const plans = ['trial', 'monthly', 'quarterly', 'annual'];
        const statuses = ['active', 'expired', 'suspended'];
        
        return Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            name: names[i],
            email: `${names[i].toLowerCase().replace(' ', '.')}@example.com`,
            company: companies[Math.floor(Math.random() * companies.length)],
            plan: plans[Math.floor(Math.random() * plans.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            joined: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalScans: Math.floor(Math.random() * 1000) + 50
        }));
    }
    
    displayUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>#${user.id}</td>
                <td>
                    <div class="user-info">
                        <div class="user-name">${user.name}</div>
                        <div class="user-company">${user.company}</div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="plan-badge">${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}</span>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                </td>
                <td>${user.joined}</td>
                <td>${user.lastLogin}</td>
                <td>${user.totalScans}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editUser(${user.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn view" onclick="viewUser(${user.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    updateStats() {
        // For demo, set some stats
        document.getElementById('totalUsers').textContent = '8';
        document.getElementById('activeUsers').textContent = '5';
        document.getElementById('paidUsers').textContent = '3';
        document.getElementById('totalScans').textContent = '2,847';
    }
    
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filterUsers();
            });
        }
        
        // Plan filter
        const planFilter = document.getElementById('planFilter');
        if (planFilter) {
            planFilter.addEventListener('change', () => {
                this.filterUsers();
            });
        }
    }
    
    filterUsers(searchTerm = '') {
        // In real app, filter from API
        // For demo, just log the filters
        const status = document.getElementById('statusFilter').value;
        const plan = document.getElementById('planFilter').value;
        
        console.log('Filtering users:', { searchTerm, status, plan });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

// Global functions
function addNewUser() {
    alert('Add new user feature would open a modal form here');
    // Implementation for adding new user
}

function editUser(userId) {
    alert(`Edit user ${userId} - This would open edit form`);
    // Implementation for editing user
}

function viewUser(userId) {
    alert(`View user ${userId} details`);
    // Implementation for viewing user details
}

function deleteUser(userId) {
    if (confirm(`Delete user ${userId}? This action cannot be undone.`)) {
        alert(`User ${userId} deleted (simulated)`);
        // In real app, call API to delete user
    }
}
