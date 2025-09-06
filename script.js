// Main JavaScript file for Padel Social website

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuToggle && nav) {
        mobileMenuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = nav.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!nav.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                nav.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }
    
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Form validation and submission
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderBottomColor = '#ff6b6b';
                } else {
                    field.style.borderBottomColor = '#DEDB1F';
                }
            });
            
            if (isValid) {
                // Show success message
                showNotification('Thank you! Your message has been sent.', 'success');
                form.reset();
            } else {
                showNotification('Please fill in all required fields.', 'error');
            }
        });
    });
    
    // Notification system
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            ${type === 'success' ? 'background-color: #4CAF50;' : 'background-color: #f44336;'}
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Court booking functionality
    if (window.location.pathname.includes('booking')) {
        initializeCourtBooking();
    }
    
    function initializeCourtBooking() {
        // This will be implemented in the booking page
        console.log('Court booking system initialized');
    }
    
    // Event registration functionality
    if (window.location.pathname.includes('events')) {
        initializeEventRegistration();
    }
    
    function initializeEventRegistration() {
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            const registerBtn = card.querySelector('.register-btn');
            if (registerBtn) {
                registerBtn.addEventListener('click', function() {
                    const eventTitle = card.querySelector('.event-title').textContent;
                    showNotification(`Registration for "${eventTitle}" is coming soon!`, 'success');
                });
            }
        });
    }
    
    // Pricing plan selection
    if (window.location.pathname.includes('pricing')) {
        initializePricingPlans();
    }
    
    function initializePricingPlans() {
        const planCards = document.querySelectorAll('.pricing-card');
        planCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove active class from all cards
                planCards.forEach(c => c.classList.remove('active'));
                // Add active class to clicked card
                this.classList.add('active');
            });
        });
    }
    
    // Add active class styles for pricing cards
    const style = document.createElement('style');
    style.textContent = `
        .pricing-card.active {
            border-color: var(--citrine);
            transform: scale(1.05);
        }
        .pricing-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
});

// Utility functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatTime(time) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(time);
}
