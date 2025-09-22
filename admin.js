// Admin Dashboard for Padel Social

class AdminDashboard {
    constructor() {
        this.isLoggedIn = false;
        this.bookings = [];
        this.filteredBookings = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processLogin();
            });
        } else {
            console.error('Login form not found during setup');
        }
        
        // Filter controls
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const courtFilter = document.getElementById('court-filter');
        if (courtFilter) {
            courtFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const resetFilters = document.getElementById('reset-filters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => this.resetFilters());
        }
        
        const exportBookings = document.getElementById('export-bookings');
        if (exportBookings) {
            exportBookings.addEventListener('click', () => this.exportBookings());
        }
        
        // Quick action buttons
        const refreshData = document.getElementById('refresh-data');
        if (refreshData) {
            refreshData.addEventListener('click', () => this.loadBookings());
        }
        
        const clearDemoData = document.getElementById('clear-demo-data');
        if (clearDemoData) {
            clearDemoData.addEventListener('click', () => this.clearDemoData());
        }
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    checkLoginStatus() {
        // Check if admin is already logged in (for demo purposes)
        const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn) {
            this.showDashboard();
        }
    }
    
    processLogin() {
        console.log('processLogin called - using booking system approach');
        
        // Get form data the same way as booking system
        const loginForm = document.getElementById('admin-login-form');
        if (!loginForm) {
            console.error('Login form not found');
            this.showNotification('Login form not found. Please refresh the page.', 'error');
            return;
        }
        
        const formData = new FormData(loginForm);
        const username = formData.get('username') || '';
        const password = formData.get('password') || '';
        
        if (!username.trim() || !password.trim()) {
            this.showNotification('Please enter both username and password', 'error');
            return;
        }
        
        // Simple demo authentication
        if (username.trim() === 'admin' && password.trim() === 'padel2025') {
            this.isLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            if (typeof checkAdminLoginState === 'function') checkAdminLoginState();
            this.showDashboard();
            this.showNotification('Login successful!', 'success');
        } else {
            this.showNotification('Invalid credentials. Please use: admin / padel2025', 'error');
        }
    }
    
    handleLoginWithValues(username, password) {
        console.log('handleLoginWithValues called with:', { username, password });
        
        if (!username || !password) {
            this.showNotification('Please enter both username and password', 'error');
            return;
        }
        
        // Simple demo authentication
        if (username === 'admin' && password === 'padel2025') {
            this.isLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            if (typeof checkAdminLoginState === 'function') checkAdminLoginState();
            this.showDashboard();
            this.showNotification('Login successful!', 'success');
        } else {
            console.log('Login failed - invalid credentials'); // Debug log
            this.showNotification('Invalid credentials. Please use: admin / padel2025', 'error');
        }
    }
    
    handleLogin() {
        console.log('handleLogin called'); // Debug log
        
        const loginForm = document.getElementById('admin-login-form');
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        
        console.log('Form and input elements:', { loginForm, usernameInput, passwordInput }); // Debug log
        
        if (!usernameInput || !passwordInput || !loginForm) {
            console.error('Login form or inputs not found');
            this.showNotification('Login form not found. Please refresh the page.', 'error');
            return;
        }
        
        // Try to get values directly from inputs
        let username = usernameInput.value ? usernameInput.value.trim() : '';
        let password = passwordInput.value ? passwordInput.value.trim() : '';
        
        // If direct method fails, try FormData as backup
        if (!username || !password) {
            const formData = new FormData(loginForm);
            username = formData.get('username') ? formData.get('username').trim() : '';
            password = formData.get('password') ? formData.get('password').trim() : '';
            console.log('Using FormData backup:', { username, password });
        }
        
        console.log('Final login attempt:', { 
            username: username, 
            password: password,
            usernameLength: username.length,
            passwordLength: password.length
        }); // Debug log
        
        if (!username || !password) {
            this.showNotification('Please enter both username and password', 'error');
            return;
        }
        
        // Simple demo authentication
        if (username === 'admin' && password === 'padel2025') {
            this.isLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
            this.showNotification('Login successful!', 'success');
        } else {
            console.log('Login failed - invalid credentials'); // Debug log
            this.showNotification('Invalid credentials. Please use: admin / padel2025', 'error');
        }
    }
    
    showDashboard() {
        document.getElementById('admin-login-section').style.display = 'none';
        document.getElementById('admin-dashboard-section').style.display = 'block';
        this.loadBookings();
        this.updateStats();
    }
    
    loadBookings() {
        // Load bookings from localStorage (stored by booking system)
        const storedBookings = localStorage.getItem('adminBookings');
        this.bookings = JSON.parse(storedBookings || '[]');
        this.filteredBookings = [...this.bookings];
        this.renderBookings();
        this.updateStats();
    }
    
    updateStats() {
        const summary = JSON.parse(localStorage.getItem('bookingSummary') || '{"totalBookings": 0, "todaysBookings": 0}');
        
        // Update total bookings
        document.getElementById('total-bookings').textContent = this.bookings.length;
        
        // Calculate today's bookings
        const today = new Date().toISOString().split('T')[0];
        const todaysBookings = this.bookings.filter(booking => booking.date === today);
        document.getElementById('todays-bookings').textContent = todaysBookings.length;
        
        // Calculate today's revenue
        const todaysRevenue = todaysBookings.reduce((total, booking) => total + (booking.price || 0), 0);
        document.getElementById('todays-revenue').textContent = `$${todaysRevenue}`;
        
        // Active courts is static for now
        document.getElementById('active-courts').textContent = '3';
    }
    
    renderBookings() {
        const tableBody = document.getElementById('bookings-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (this.filteredBookings.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="10" class="no-bookings">No bookings found</td>';
            tableBody.appendChild(row);
            return;
        }
        
        this.filteredBookings.forEach(booking => {
            const row = document.createElement('tr');
            row.className = 'booking-row';
            
            const bookingDate = new Date(booking.date);
            const formattedDate = bookingDate.toLocaleDateString();
            const formattedTime = this.formatTime(booking.time);
            const endTime = this.addMinutesToTime(booking.time, booking.duration);
            const timeRange = `${formattedTime} - ${this.formatTime(endTime)}`;
            
            row.innerHTML = `
                <td class="booking-id">${booking.id || 'N/A'}</td>
                <td class="booking-date">${formattedDate}</td>
                <td class="booking-time">${timeRange}</td>
                <td class="booking-court">Court ${booking.courtId || booking.court?.id || 'N/A'}</td>
                <td class="booking-player">${booking.playerName || 'N/A'}</td>
                <td class="booking-email">${booking.playerEmail || 'N/A'}</td>
                <td class="booking-duration">${booking.duration || 60} min</td>
                <td class="booking-price">$${booking.price || 0}</td>
                <td class="booking-status">
                    <span class="status-badge ${booking.status || 'confirmed'}">${booking.status || 'confirmed'}</span>
                </td>
                <td class="booking-actions">
                    <button class="btn-small btn-info" onclick="adminDashboard.viewBookingDetails('${booking.id}')">View</button>
                    <button class="btn-small btn-danger" onclick="adminDashboard.cancelBooking('${booking.id}')">Cancel</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    applyFilters() {
        const dateFilter = document.getElementById('date-filter').value;
        const courtFilter = document.getElementById('court-filter').value;
        
        this.filteredBookings = this.bookings.filter(booking => {
            let matchesDate = true;
            let matchesCourt = true;
            
            if (dateFilter) {
                matchesDate = booking.date === dateFilter;
            }
            
            if (courtFilter !== 'all') {
                const courtId = booking.courtId || booking.court?.id;
                matchesCourt = String(courtId) === courtFilter;
            }
            
            return matchesDate && matchesCourt;
        });
        
        this.renderBookings();
    }
    
    resetFilters() {
        document.getElementById('date-filter').value = '';
        document.getElementById('court-filter').value = 'all';
        this.filteredBookings = [...this.bookings];
        this.renderBookings();
    }
    
    viewBookingDetails(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        const bookingDate = new Date(booking.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const startTime = this.formatTime(booking.time);
        const endTime = this.formatTime(this.addMinutesToTime(booking.time, booking.duration));
        const bookedDate = new Date(booking.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const details = `
            <div class="booking-detail-grid">
                <div class="booking-detail-section">
                    <h4>Booking Information</h4>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Booking ID:</span>
                        <span class="booking-detail-value">${booking.id}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Date:</span>
                        <span class="booking-detail-value">${bookingDate}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Time:</span>
                        <span class="booking-detail-value">${startTime} - ${endTime}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Duration:</span>
                        <span class="booking-detail-value">${booking.duration} minutes</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Court:</span>
                        <span class="booking-detail-value">${booking.court?.name || `Court ${booking.courtId}`}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Price:</span>
                        <span class="booking-detail-value">$${booking.price}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Status:</span>
                        <span class="booking-detail-value status-badge ${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                    </div>
                </div>

                <div class="booking-detail-section">
                    <h4>Player Information</h4>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Name:</span>
                        <span class="booking-detail-value">${booking.playerName}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Email:</span>
                        <span class="booking-detail-value">${booking.playerEmail}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Phone:</span>
                        <span class="booking-detail-value">${booking.playerPhone || 'Not provided'}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Skill Level:</span>
                        <span class="booking-detail-value">${booking.playerLevel || 'Not specified'}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Additional Players:</span>
                        <span class="booking-detail-value">${booking.additionalPlayers || 'None'}</span>
                    </div>
                </div>

                <div class="booking-detail-section" style="grid-column: 1 / -1;">
                    <h4>Additional Information</h4>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Special Requests:</span>
                        <span class="booking-detail-value">${booking.specialRequests || 'None'}</span>
                    </div>
                    <div class="booking-detail-item">
                        <span class="booking-detail-label">Booking Created:</span>
                        <span class="booking-detail-value">${bookedDate}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('Booking Details', details);
    }
    
    cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        
        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) return;
        
        // Update booking status
        this.bookings[bookingIndex].status = 'cancelled';
        
        // Update localStorage
        localStorage.setItem('adminBookings', JSON.stringify(this.bookings));
        
        // Refresh display
        this.loadBookings();
        this.showNotification('Booking cancelled successfully', 'success');
    }
    
    exportBookings() {
        if (this.filteredBookings.length === 0) {
            this.showNotification('No bookings to export', 'error');
            return;
        }
        
        // Create CSV content
        const headers = ['ID', 'Date', 'Time', 'Court', 'Player Name', 'Email', 'Phone', 'Duration', 'Price', 'Status', 'Booked At'];
        const csvContent = [
            headers.join(','),
            ...this.filteredBookings.map(booking => [
                booking.id || '',
                booking.date || '',
                booking.time || '',
                `Court ${booking.courtId || booking.court?.id || ''}`,
                booking.playerName || '',
                booking.playerEmail || '',
                booking.playerPhone || '',
                booking.duration || '',
                booking.price || '',
                booking.status || '',
                booking.timestamp || ''
            ].join(','))
        ].join('\n');
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `padel-bookings-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Bookings exported successfully', 'success');
    }
    
    clearDemoData() {
        if (!confirm('Are you sure you want to clear all booking data? This cannot be undone.')) return;
        
        localStorage.removeItem('adminBookings');
        localStorage.removeItem('bookingSummary');
        this.loadBookings();
        this.showNotification('Demo data cleared', 'success');
    }
    
    logout() {
    sessionStorage.removeItem('adminLoggedIn');
    this.isLoggedIn = false;
    if (typeof checkAdminLoginState === 'function') checkAdminLoginState();
    document.getElementById('admin-dashboard-section').style.display = 'none';
    document.getElementById('admin-login-section').style.display = 'block';
    this.showNotification('Logged out successfully', 'success');
    }
    
    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification notification-${type}`;
        notification.textContent = message;
        
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
            ${type === 'success' ? 'background-color: #4CAF50;' : 
              type === 'error' ? 'background-color: #f44336;' : 
              'background-color: #2196F3;'}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }
    
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    addMinutesToTime(time, minutes) {
        const totalMinutes = this.timeToMinutes(time) + minutes;
        return this.minutesToTime(totalMinutes);
    }
}

// Initialize the admin dashboard when the page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', function() {
    try {
        adminDashboard = new AdminDashboard();
        console.log('Admin dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
    }
});

// Test function for debugging login issues
function testLogin() {
    console.log('Test login function called');
    
    // Set test values
    const usernameInput = document.getElementById('admin-username');
    const passwordInput = document.getElementById('admin-password');
    
    if (usernameInput && passwordInput) {
        usernameInput.value = 'admin';
        passwordInput.value = 'padel2025';
        console.log('Test values set');
        
        // Trigger login
        if (adminDashboard) {
            adminDashboard.handleLogin();
        } else {
            console.error('adminDashboard not initialized');
        }
    } else {
        console.error('Input elements not found');
    }
}

// Also try to initialize after window load as backup
window.addEventListener('load', function() {
    if (!adminDashboard) {
        try {
            adminDashboard = new AdminDashboard();
            console.log('Admin dashboard initialized on window load');
        } catch (error) {
            console.error('Error initializing admin dashboard on window load:', error);
        }
    }
});