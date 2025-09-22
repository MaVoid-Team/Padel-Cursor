# Padel Social Website

A complete replica of the Padel Social website built with HTML, CSS, and JavaScript. This project includes all the pages and features from the original website, plus a custom court booking system.

## 🏆 Features

### Pages
- **Homepage** - Hero section with call-to-action and feature highlights
- **Pricing** - Membership plans with detailed features and FAQ
- **Events** - Upcoming tournaments and social events
- **About** - Club story, team information, and facility details
- **Padel Basics** - Rules, equipment, and getting started guide
- **Contact** - Contact form and location information
- **Policies** - Terms of service, privacy policy, and facility rules
- **Court Booking** - Custom booking system (built from scratch)
- **Admin Dashboard** - Complete booking management system

### Key Features
- ✅ Responsive design for all devices
- ✅ Mobile-optimized navigation with hamburger menu
- ✅ Interactive court booking system
- ✅ Admin dashboard for booking management
- ✅ Form validation and user feedback
- ✅ Modern, clean design matching the original
- ✅ Mobile booking access via sidebar menu
- ✅ Booking button accessible on all mobile pages
- ✅ Color palette: Midnight Green, Citrine, Dun, White
- ✅ Professional typography and spacing

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

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)** - Interactive functionality
- **Google Fonts** - Typography
- **No Dependencies** - Pure vanilla JavaScript

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
