// Enhanced Court Booking System for Padel Social

class CourtBookingSystem {
    constructor() {
        this.courts = [
            { id: 1, name: 'Court 1', status: 'available', maintenance: false },
            { id: 2, name: 'Court 2', status: 'available', maintenance: false },
            { id: 3, name: 'Court 3', status: 'available', maintenance: false }
        ];
        
        this.timeSlots = [
            '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
            '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
            '20:00', '21:00'
        ];
        
        this.pricing = {
            member: { 60: 25, 90: 35, 120: 45 },
            nonMember: { 60: 35, 90: 50, 120: 65 }
        };
        
        this.selectedBooking = null;
        this.isMember = false;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedDuration = 60;
        this.bookings = this.generateSampleBookings();
        
        this.init();
    }
    
    init() {
        this.setupDatePicker();
        this.setupEventListeners();
        this.renderDatePicker();
    }
    
    setupDatePicker() {
        const dateInput = document.getElementById('booking-date');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (dateInput) {
            dateInput.min = tomorrow.toISOString().split('T')[0];
            dateInput.value = tomorrow.toISOString().split('T')[0];
            
            const maxDate = new Date(today);
            maxDate.setDate(maxDate.getDate() + 30);
            dateInput.max = maxDate.toISOString().split('T')[0];
        }
    }
    
    setupEventListeners() {
        // Date picker navigation
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderDatePicker();
        });
        
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderDatePicker();
        });
        
        // Duration selection
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDuration(parseInt(e.target.dataset.duration));
            });
        });
        
        // Final booking form
        const finalForm = document.getElementById('final-booking-form');
        if (finalForm) {
            finalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processBooking();
            });
        }
        
        // Back to courts
        const backBtn = document.getElementById('back-to-courts');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.hideBookingForm();
            });
        }
    }
    
    generateSampleBookings() {
        const bookings = [];
        const today = new Date();
        
        // Generate some sample bookings for the next 30 days
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            // Randomly generate some bookings
            if (Math.random() > 0.7) {
                const courtId = Math.floor(Math.random() * 3) + 1;
                const timeSlot = this.timeSlots[Math.floor(Math.random() * this.timeSlots.length)];
                const duration = [60, 90, 120][Math.floor(Math.random() * 3)];
                
                bookings.push({
                    id: `booking_${i}`,
                    courtId: courtId,
                    date: date.toISOString().split('T')[0],
                    time: timeSlot,
                    duration: duration,
                    playerName: `Player ${i + 1}`,
                    status: 'confirmed'
                });
            }
        }
        
        return bookings;
    }
    
    renderDatePicker() {
        const datePickerGrid = document.getElementById('date-picker-grid');
        const currentMonth = document.getElementById('current-month');
        
        // Update month header
        currentMonth.textContent = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Clear date picker
        datePickerGrid.innerHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            datePickerGrid.appendChild(dayHeader);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day other-month';
            emptyDay.textContent = '';
            datePickerGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateString = currentDate.toISOString().split('T')[0];
            
            // Check if this is today
            const today = new Date();
            if (currentDate.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Check availability for this date
            const availability = this.getDateAvailability(dateString);
            if (availability === 'fully-booked') {
                dayElement.classList.add('fully-booked');
                dayElement.innerHTML = `${day}<div class="availability-indicator full">Full</div>`;
            } else if (availability === 'partially-booked') {
                dayElement.classList.add('partially-booked');
                dayElement.innerHTML = `${day}<div class="availability-indicator partial">Limited</div>`;
            } else {
                dayElement.innerHTML = `${day}<div class="availability-indicator available">Available</div>`;
            }
            
            // Add click event
            dayElement.addEventListener('click', () => {
                if (!dayElement.classList.contains('other-month') && !dayElement.classList.contains('fully-booked')) {
                    this.selectDate(currentDate);
                }
            });
            
            datePickerGrid.appendChild(dayElement);
        }
    }
    
    getDateAvailability(dateString) {
        const dayBookings = this.bookings.filter(booking => booking.date === dateString);
        const totalSlots = this.timeSlots.length * this.courts.length;
        const bookedSlots = dayBookings.length;
        
        if (bookedSlots === 0) return 'available';
        if (bookedSlots >= totalSlots * 0.8) return 'fully-booked';
        if (bookedSlots >= totalSlots * 0.5) return 'partially-booked';
        return 'available';
    }
    
    selectDate(date) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // Add selection to clicked day
        event.target.closest('.calendar-day').classList.add('selected');
        
        // Update selected date
        this.selectedDate = date;
        const dateString = date.toISOString().split('T')[0];
        
        // Update date input
        const dateInput = document.getElementById('booking-date');
        if (dateInput) {
            dateInput.value = dateString;
        }
        
        // Show booking table
        this.showBookingTable(date);
    }
    
    showBookingTable(date) {
        const bookingTableSection = document.getElementById('booking-table-section');
        const selectedDateDisplay = document.getElementById('selected-date-display');
        
        if (selectedDateDisplay) {
            selectedDateDisplay.textContent = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        if (bookingTableSection) {
            bookingTableSection.style.display = 'block';
            this.renderBookingTable(date);
        }
    }
    
    renderBookingTable(date) {
        const tableBody = document.getElementById('booking-table-body');
        const dateString = date.toISOString().split('T')[0];
        
        // Clear table body
        tableBody.innerHTML = '';
        
        // Get bookings for this date
        const dayBookings = this.bookings.filter(booking => booking.date === dateString);
        
        // Create time slots
        this.timeSlots.forEach(timeSlot => {
            const row = document.createElement('tr');
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            timeCell.textContent = this.formatTime(timeSlot);
            row.appendChild(timeCell);
            
            // Court cells
            this.courts.forEach(court => {
                const courtCell = document.createElement('td');
                courtCell.className = 'court-cell';
                
                // Check if this court is booked at this time
                const isBooked = dayBookings.some(booking => 
                    booking.courtId === court.id && booking.time === timeSlot
                );
                
                // Check if court is under maintenance
                const isMaintenance = court.maintenance;
                
                if (isMaintenance) {
                    courtCell.className += ' maintenance';
                    courtCell.textContent = 'Maintenance';
                } else if (isBooked) {
                    courtCell.className += ' booked';
                    courtCell.textContent = 'Booked';
                } else {
                    courtCell.className += ' available';
                    courtCell.textContent = 'Available';
                    courtCell.dataset.courtId = court.id;
                    courtCell.dataset.time = timeSlot;
                    
                    // Add click event
                    courtCell.addEventListener('click', () => {
                        this.selectCourtSlot(court, timeSlot);
                    });
                }
                
                row.appendChild(courtCell);
            });
            
            tableBody.appendChild(row);
        });
    }
    
    selectCourtSlot(court, timeSlot) {
        // Remove previous selections
        document.querySelectorAll('.court-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Add selection to clicked cell
        event.target.classList.add('selected');
        
        // Store booking details
        this.selectedBooking = {
            court: court,
            time: timeSlot,
            date: this.selectedDate.toISOString().split('T')[0]
        };
        
        // Show duration selection
        this.showDurationSelection();
    }
    
    showDurationSelection() {
        const durationSection = document.getElementById('duration-section');
        if (durationSection) {
            durationSection.style.display = 'block';
            durationSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    selectDuration(duration) {
        // Remove previous selection
        document.querySelectorAll('.duration-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        event.target.classList.add('selected');
        
        // Update selected duration
        this.selectedDuration = duration;
        
        // Update booking details
        if (this.selectedBooking) {
            this.selectedBooking.duration = duration;
            this.showBookingSummary();
        }
    }
    
    showBookingSummary() {
        if (!this.selectedBooking) return;
        
        const summary = document.getElementById('booking-summary');
        const selectedDate = new Date(this.selectedBooking.date);
        const endTime = this.addMinutesToTime(this.selectedBooking.time, this.selectedBooking.duration);
        
        if (summary) {
            document.getElementById('summary-date').textContent = selectedDate.toLocaleDateString();
            document.getElementById('summary-time').textContent = `${this.formatTime(this.selectedBooking.time)} - ${this.formatTime(endTime)}`;
            document.getElementById('summary-duration').textContent = `${this.selectedBooking.duration} minutes`;
            document.getElementById('summary-court').textContent = this.selectedBooking.court.name;
            
            const price = this.calculatePrice(this.selectedBooking.duration);
            document.getElementById('summary-price').textContent = `$${price} ${this.isMember ? '(Member)' : '(Non-Member)'}`;
            
            summary.style.display = 'block';
            summary.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    showBookingForm() {
        const summary = document.getElementById('booking-summary');
        const form = document.getElementById('booking-form');
        
        if (summary) summary.style.display = 'none';
        if (form) {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    hideBookingForm() {
        const summary = document.getElementById('booking-summary');
        const form = document.getElementById('booking-form');
        
        if (form) form.style.display = 'none';
        if (summary) summary.style.display = 'block';
    }
    
    calculatePrice(duration) {
        const pricing = this.isMember ? this.pricing.member : this.pricing.nonMember;
        return pricing[duration] || 0;
    }
    
    processBooking() {
        const formData = new FormData(document.getElementById('final-booking-form'));
        const bookingData = {
            ...this.selectedBooking,
            playerName: formData.get('player-name'),
            playerEmail: formData.get('player-email'),
            playerPhone: formData.get('player-phone'),
            playerLevel: formData.get('player-level'),
            additionalPlayers: formData.get('additional-players'),
            specialRequests: formData.get('special-requests'),
            price: this.calculatePrice(this.selectedBooking.duration)
        };
        
        // In a real application, this would send data to a server
        console.log('Booking data:', bookingData);
        
        // Show success message
        this.showBookingConfirmation(bookingData);
    }
    
    showBookingConfirmation(bookingData) {
        const confirmation = document.createElement('div');
        confirmation.className = 'booking-confirmation';
        confirmation.innerHTML = `
            <div class="confirmation-content">
                <h3>Booking Confirmed! 🎉</h3>
                <p>Your court booking has been confirmed. You will receive a confirmation email shortly.</p>
                <div class="confirmation-details">
                    <p><strong>Court:</strong> ${bookingData.court.name}</p>
                    <p><strong>Date:</strong> ${new Date(bookingData.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${this.formatTime(bookingData.time)} - ${this.formatTime(this.addMinutesToTime(bookingData.time, bookingData.duration))}</p>
                    <p><strong>Duration:</strong> ${bookingData.duration} minutes</p>
                    <p><strong>Price:</strong> $${bookingData.price}</p>
                </div>
                <button class="btn btn-primary" onclick="location.reload()">Book Another Court</button>
            </div>
        `;
        
        document.body.appendChild(confirmation);
        
        // Remove confirmation after 10 seconds
        setTimeout(() => {
            if (confirmation.parentNode) {
                confirmation.parentNode.removeChild(confirmation);
            }
        }, 10000);
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

// Initialize the booking system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    new CourtBookingSystem();
});

// Add CSS for booking confirmation
const confirmationStyles = `
.booking-confirmation {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeInUp 0.5s ease-out;
}

.confirmation-content {
    background-color: var(--midnight-green-2);
    padding: 40px;
    border-radius: 12px;
    text-align: center;
    max-width: 500px;
    margin: 20px;
    border: 2px solid var(--citrine);
    animation: scaleIn 0.6s ease-out;
}

.confirmation-content h3 {
    color: var(--citrine);
    font-size: 28px;
    margin-bottom: 20px;
    animation: bounce 0.6s ease-in-out;
}

.confirmation-content p {
    color: var(--white);
    margin-bottom: 20px;
    line-height: 1.6;
}

.confirmation-details {
    background-color: var(--midnight-green);
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    text-align: left;
}

.confirmation-details p {
    margin-bottom: 10px;
    color: var(--white);
}

/* Responsive styles for booking table */
@media (max-width: 768px) {
    .booking-table {
        font-size: 12px;
    }
    
    .booking-table th,
    .booking-table td {
        padding: 8px 4px;
    }
    
    .duration-options {
        flex-direction: column;
        align-items: center;
    }
    
    .duration-btn {
        width: 200px;
    }
    
    .booking-legend {
        flex-direction: column;
        gap: 15px;
    }
}
`;

// Add the styles to the page
const styleSheet = document.createElement('style');
styleSheet.textContent = confirmationStyles;
document.head.appendChild(styleSheet);