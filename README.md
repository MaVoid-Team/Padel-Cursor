# Padel Social Court Booking System

A comprehensive court booking system for padel tennis facilities, featuring PostgreSQL database persistence, admin dashboard, and responsive design. **Migrated from localStorage to PostgreSQL database for production-ready data persistence.**

## 🏆 Features

### Core Pages
- **Homepage** - Hero section with call-to-action and feature highlights
- **Pricing** - Membership plans with detailed features and FAQ
- **Events** - Upcoming tournaments and social events
- **About** - Club story, team information, and facility details
- **Padel Basics** - Rules, equipment, and getting started guide
- **Contact** - Contact form and location information
- **Policies** - Terms of service, privacy policy, and facility rules
- **Court Booking** - Full-featured booking system with PostgreSQL backend
- **Admin Dashboard** - Complete booking management with JWT authentication

### Key Features
- ✅ **PostgreSQL Database**: Persistent data storage with full ACID compliance
- ✅ **RESTful API**: Node.js/Express backend with comprehensive endpoints
- ✅ **JWT Authentication**: Secure admin authentication and authorization
- ✅ **Docker Support**: Complete containerization with PostgreSQL, Node.js, and Nginx
- ✅ **Responsive design** for all devices
- ✅ **Mobile-optimized** navigation with hamburger menu
- ✅ **Interactive court booking** system with real-time availability
- ✅ **Admin dashboard** for comprehensive booking management
- ✅ **Form validation** and user feedback
- ✅ **Modern, clean design** matching the original
- ✅ **API-driven architecture** replacing localStorage
- ✅ **Production-ready** with proper error handling and logging

## 🎨 Design System

### Color Palette
- **Midnight Green**: `#013C3C` - Primary background
- **Citrine**: `#DEDB1F` - Accent color for highlights
- **Dun**: `#C7BEAD` - Secondary text color
- **Midnight Green 2**: `#073938` - Card backgrounds
- **White**: `#FFFFFF` - Primary text color

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

## 🚀 Court Booking System

The custom court booking system includes:

- **Date Selection** - Calendar picker with 30-day advance booking
- **Time Slots** - Hourly slots from 6 AM to 10 PM
- **Duration Options** - 1, 1.5, or 2-hour sessions
- **Court Availability** - Real-time availability checking
- **Pricing** - Member and non-member rates
- **Booking Form** - Complete player information collection
- **Confirmation** - Booking confirmation with details

## 🔧 Admin Dashboard

The admin dashboard provides complete booking management:

- **Admin Login** - Secure access with demo credentials (admin/padel2025)
- **Booking Overview** - View all bookings in a sortable table
- **Filtering** - Filter bookings by date and court
- **Export Data** - Export booking data to CSV format
- **Statistics** - Real-time booking and revenue statistics  
- **Booking Management** - View details and cancel bookings
- **Mobile Responsive** - Admin panel works on all devices

### Admin Access
- Navigate to `admin.html`
- Username: `admin`
- Password: `padel2025`

### Booking Features
- Real-time availability simulation
- Dynamic pricing based on membership status
- Form validation and error handling
- Mobile-responsive booking interface
- Booking confirmation system

## 📱 Responsive Design

The website is fully responsive with breakpoints at:
- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: 480px - 767px
- **Small Mobile**: Below 480px

### Mobile Features
- Hamburger menu navigation
- Touch-friendly interface
- Optimized layouts for small screens
- Swipe-friendly interactions
- Booking button in mobile sidebar menu
- Full booking functionality on mobile

## 🛠️ Technical Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)** - Interactive functionality with Fetch API
- **Google Fonts** - Typography
- **Vanilla JavaScript** - No framework dependencies

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Primary database with Sequelize ORM
- **Sequelize** - ORM with migration support
- **Sequelize CLI** - Database migration management
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving
- **PostgreSQL 15** - Database with Alpine Linux

## 🚀 Quick Start with Docker

1. **Prerequisites**: Install Docker and Docker Compose

2. **Clone and Start**:
   ```bash
   git clone <repository-url>
   cd Padel-Cursor
   docker-compose up -d
   ```

3. **Access Application**:
   - Frontend: http://localhost:8418
   - API: http://localhost:3000/api
   - Admin: http://localhost:8418/admin (admin/admin123)

4. **Database Setup**: Automatic via Docker with sample data

## 📊 PostgreSQL Database Schema

The database schema is managed using **Sequelize Migrations** for version-controlled, reproducible database changes.

### Quick Start with Migrations

```bash
# Run all migrations (recommended)
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Add sample data
npm run db:seed
```

### Database Schema

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    court_id INTEGER NOT NULL CHECK (court_id IN (1, 2, 3)),
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER NOT NULL CHECK (duration IN (60, 90, 120)),
    player_name VARCHAR(255) NOT NULL,
    player_email VARCHAR(255) NOT NULL,
    player_phone VARCHAR(50),
    player_level VARCHAR(50) CHECK (player_level IN ('Beginner', 'Intermediate', 'Advanced')),
    additional_players INTEGER DEFAULT 0,
    special_requests TEXT,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**See:** `backend/MIGRATIONS.md` for complete migration documentation and `backend/MIGRATION_QUICK_REF.md` for quick reference.

## 🔐 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/bookings/:date` - Get bookings for specific date
- `POST /api/bookings` - Create new booking

### Admin Endpoints (JWT Required)
- `POST /api/admin/login` - Authentication
- `GET /api/admin/bookings` - Get all bookings
- `GET /api/admin/stats` - Booking statistics
- `PUT /api/admin/bookings/:id/cancel` - Cancel booking
- `DELETE /api/admin/bookings/demo` - Clear demo data

## 🔄 Migration from localStorage

**Key Improvements:**
- ✅ **Data Persistence**: PostgreSQL ensures data survives browser/server restarts
- ✅ **Concurrent Users**: Multiple users can book simultaneously
- ✅ **Data Integrity**: ACID compliance prevents booking conflicts
- ✅ **Scalability**: Handles thousands of bookings efficiently
- ✅ **Backup & Recovery**: Professional database management
- ✅ **Analytics**: Complex queries for business insights
- ✅ **Security**: JWT authentication and input validation

## 📁 File Structure

```
├── index.html              # Homepage
├── pricing.html            # Pricing page
├── events.html             # Events page
├── about.html              # About page
├── padel-basics.html       # Padel basics page
├── contact.html            # Contact page
├── policies.html           # Policies page
├── booking.html            # Court booking page
├── admin.html              # Admin dashboard
├── styles.css              # Main stylesheet
├── script.js               # Main JavaScript
├── booking.js              # Booking system JavaScript
├── admin.js                # Admin dashboard JavaScript
└── README.md               # Project documentation
```

## 🎯 Getting Started

1. **Clone or Download** the project files
2. **Open** `index.html` in a web browser
3. **Navigate** through the different pages using the menu
4. **Test** the booking system on the booking page

## 🔧 Customization

### Adding New Courts
Edit the `courts` array in `booking.js`:
```javascript
this.courts = [
    { id: 1, name: 'Court 1', status: 'available', maintenance: false },
    { id: 2, name: 'Court 2', status: 'available', maintenance: false },
    // Add more courts here
];
```

### Updating Pricing
Modify the `pricing` object in `booking.js`:
```javascript
this.pricing = {
    member: { 60: 25, 90: 35, 120: 45 },
    nonMember: { 60: 35, 90: 50, 120: 65 }
};
```

### Changing Colors
Update the CSS variables in `styles.css`:
```css
:root {
    --midnight-green: #013C3C;
    --citrine: #DEDB1F;
    --dun: #C7BEAD;
    --midnight-green-2: #073938;
    --white: #FFFFFF;
}
```

## 📞 Contact

For questions about this project or the Padel Social website, please contact:
- **Email**: info@padelsocial.com
- **Phone**: (301) 555-PADEL
- **Location**: Westbard Square, Bethesda, MD 20816

## 📄 License

This project is created as a replica for demonstration purposes. All content and design elements are inspired by the original Padel Social website.

---

**Built with ❤️ for the Padel community**
