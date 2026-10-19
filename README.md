# Padel Social

A padel club website with a real court-booking desk — pick a time, grab a court, show up ready to play.

## Who it's for

Players who just want a court, and the people who run the club. This is the public site for Padel Social, a Bethesda pop-up with three outdoor courts, memberships, and a social calendar.

## What you can do

- Book Court 1, 2, or 3 up to 30 days out — 1, 1.5, or 2 hours, from 6 AM to 10 PM
- Compare memberships and member vs walk-up rates before you book
- Check Friday socials, ladies' night, and tournament days
- Learn padel rules, scoring, and gear before your first match
- Staff can review bookings, export a CSV, and free up a slot

## Try it

[Open the live site](https://padel-cursor.vercel.app)

Want the API, database, and admin dashboard on your machine? See [docs/SETUP.md](docs/SETUP.md).

## How it works

Club pages are static HTML. The booking page is a calendar: you pick a date, an open court, and a session length. A Node API and PostgreSQL keep reservations around for staff. Docker Compose runs the site, API, and database together.

---

Built by [Ziad Ahmed](https://github.com/Ziad-NasrEldin) at [MaVoid](https://mavoid.com).

[Website](https://mavoid.com) · [LinkedIn](https://linkedin.com/in/ziad-ahmed-634202332) · [GitHub](https://github.com/Ziad-NasrEldin)
