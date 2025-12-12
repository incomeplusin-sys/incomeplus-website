// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== BETA FORM HANDLING =====
    const betaForm = document.getElementById('betaForm');
    const successModal = document.getElementById('successModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (betaForm) {
        betaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const purpose = document.getElementById('purpose').value;
            const agreement = document.getElementById('agreement').checked;
            const sebi = document.getElementById('sebi').checked;
            
            // Validate all fields
            if (!name || !email || !purpose || !agreement || !sebi) {
                alert('Please fill all fields and accept all agreements');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Show success modal
            if (successModal) {
                successModal.style.display = 'flex';
            }
            
            // In a real application, you would send data to server here
            console.log('Beta Signup Details:', {
                name,
                email,
                purpose,
                timestamp: new Date().toISOString(),
                platform: 'Educational Tools Beta'
            });
            
            // Reset form
            betaForm.reset();
        });
    }
    
    // ===== MODAL HANDLING =====
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            if (successModal) {
                successModal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    if (successModal) {
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
    }
    
    // ===== SMOOTH SCROLLING =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== ANIMATE ELEMENTS ON SCROLL =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements to animate
    document.querySelectorAll('.tool-card, .disclaimer-point').forEach(el => {
        observer.observe(el);
    });
    
    // ===== ADD CSS FOR ANIMATIONS =====
    const style = document.createElement('style');
    style.textContent = `
        .tool-card, .disclaimer-point {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .tool-card.animate-in, .disclaimer-point.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .tool-card:nth-child(1) { transition-delay: 0.1s; }
        .tool-card:nth-child(2) { transition-delay: 0.2s; }
        .tool-card:nth-child(3) { transition-delay: 0.3s; }
        .tool-card:nth-child(4) { transition-delay: 0.4s; }
    `;
    document.head.appendChild(style);
    
    // ===== FORM INPUT ENHANCEMENTS =====
    const formInputs = document.querySelectorAll('.form-group input, .form-group select');
    
    formInputs.forEach(input => {
        // Add focus/blur classes
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if pre-filled (for browser autofill)
        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });
    
    // ===== DISCLAIMER BANNER PULSE =====
    const disclaimerBanner = document.querySelector('.disclaimer-banner');
    
    if (disclaimerBanner) {
        // Add click to expand/collapse on mobile
        disclaimerBanner.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                this.classList.toggle('expanded');
            }
        });
    }
    
    // ===== FOOTER YEAR UPDATE =====
    const yearElement = document.querySelector('.copyright');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2024', currentYear);
    }
});
