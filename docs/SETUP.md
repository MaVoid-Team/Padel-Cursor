# Setup, stack, and API

Technical notes for running **Padel Social** locally. The public-facing overview lives in the root [README](../README.md).

## Quick start with Docker

1. Install Docker and Docker Compose.
2. From the repo root:

```bash
docker-compose up -d
```

3. Open:

- Frontend: http://localhost:8418
- API (via Nginx): http://localhost:8418/api
- Backend direct: http://localhost:3581 (`docker-compose` maps host `3581` → container `3000`)
- Admin: http://localhost:8418/admin.html

4. Database setup is automatic via Docker (PostgreSQL + sample schema).

### Demo admin login

The API accepts:

- Username: `admin`
- Password: `admin123`

An earlier frontend-only demo used `admin` / `padel2025`. Prefer `admin123` when the Node API is running.

## Frontend-only

To browse the club pages without Docker:

1. Clone or download the project files.
2. Open `index.html` in a browser.
3. Use the nav to reach pricing, events, booking, and the rest.

Booking in this mode is the in-page flow (date picker, courts, confirmation). Persistent bookings and the staff dashboard need the Docker/API stack above.

## Backend without Docker

From `backend/`:

```bash
npm install
npm run db:migrate
npm run db:seed
npm start
```

Useful scripts:

```bash
npm run db:migrate          # run migrations
npm run db:migrate:status   # migration status
npm run db:seed             # sample data
npm run dev                 # nodemon
```

Default API port when run this way: http://localhost:3000/api

## Court booking (player flow)

- Date selection: calendar with up to 30-day advance booking
- Time slots: hourly from 6 AM to 10 PM
- Duration: 1, 1.5, or 2 hours
- Three outdoor courts with availability
- Member and non-member rates
- Player details form and a confirmation screen

## Admin dashboard

- JWT login
- Booking table with date/court filters
- CSV export
- Booking and revenue stats
- View or cancel bookings
- Court management tabs
- Works on mobile

## Technical stack

**Frontend**

- HTML5, CSS3 (Grid / Flexbox), vanilla JavaScript (Fetch API)
- Google Fonts (Montserrat)
- No frontend framework

**Backend**

- Node.js, Express
- PostgreSQL with Sequelize (CLI + migrations)
- JWT auth, bcryptjs, CORS

**Infrastructure**

- Docker and Docker Compose
- Nginx (static files + `/api` reverse proxy)
- PostgreSQL 15+ (Compose uses `postgres:17-alpine`)

## Design system

- Midnight Green: `#013C3C` — primary background
- Citrine: `#DEDB1F` — accent
- Dun: `#C7BEAD` — secondary text
- Midnight Green 2: `#073938` — cards
- White: `#FFFFFF` — primary text

Typography: Inter is mentioned in older notes; the live pages load **Montserrat**.

Breakpoints: desktop 1024px+, tablet 768–1023px, mobile 480–767px, small mobile below 480px. Mobile nav is a hamburger menu; booking is available from the sidebar.

## Database

Schema is versioned under `backend/src/migrations/`.

Bookings (simplified):

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

Later migrations add courts, payments, membership flag, and payment status. Use `npm run db:migrate` rather than hand-editing production tables.

## API endpoints

### Public

- `GET /api/health` — health check
- `GET /api/bookings/:date` — bookings for a date
- `POST /api/bookings` — create a booking
- `GET /api/courts` — courts
- `GET /api/courts/:id` — one court
- `GET /api/courts/:id/availability` — availability for a date

### Admin (JWT)

- `POST /api/admin/login`
- `GET /api/admin/bookings`
- `PUT /api/admin/bookings/:id`
- `DELETE /api/admin/bookings/:id`
- `GET /api/admin/stats`
- Court create/update/delete and status toggle under `/api/courts`

A Postman collection lives at `backend/Padel_Booking_API.postman_collection.json`.

## Why PostgreSQL (vs the original localStorage demo)

- Bookings survive restarts
- More than one person can book at once
- Conflict checks instead of last-write-wins
- Room to grow (stats, payments, extra courts)
- JWT + validation on the admin side

## File structure

```
├── index.html              # Homepage
├── pricing.html            # Membership plans
├── events.html             # Events
├── about.html              # About
├── padel-basics.html       # Rules and getting started
├── contact.html            # Contact
├── policies.html           # Terms / privacy / rules
├── booking.html            # Court booking
├── admin.html              # Admin dashboard
├── styles.css
├── script.js
├── booking.js
├── admin.js
├── docker-compose.yml
├── Dockerfile              # Nginx frontend
├── nginx.conf
├── backend/                # Express API, migrations, seeders
└── docs/SETUP.md           # This file
```

## Customization

### Courts

In `booking.js`:

```javascript
this.courts = [
    { id: 1, name: 'Court 1', status: 'available', maintenance: false },
    { id: 2, name: 'Court 2', status: 'available', maintenance: false },
    // Add more courts here
];
```

Admin-managed courts also live in the `courts` table when the API is running.

### Pricing

In `booking.js`:

```javascript
this.pricing = {
    member: { 60: 25, 90: 35, 120: 45 },
    nonMember: { 60: 35, 90: 50, 120: 65 }
};
```

### Colors

In `styles.css`:

```css
:root {
    --midnight-green: #013C3C;
    --citrine: #DEDB1F;
    --dun: #C7BEAD;
    --midnight-green-2: #073938;
    --white: #FFFFFF;
}
```

## Club contact (demo copy)

These are **on-page demo details** from the contact page, not project maintainer contacts:

- Phone: (301) 555-PADEL
- Location: Westbard Square, Bethesda, MD 20816
- Demo inboxes on the contact page: `info@padelsocial.com`, `bookings@padelsocial.com`, `events@padelsocial.com`

## License

Created as a replica for demonstration purposes. Content and design are inspired by the original Padel Social website.
