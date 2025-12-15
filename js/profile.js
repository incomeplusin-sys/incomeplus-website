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
                    'Content
