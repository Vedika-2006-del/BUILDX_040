<<<<<<< HEAD
# BUILDX_040
=======
# NAGPUR MEDI-RESQ — Simple Full-Stack Version

This version keeps the original HTML/CSS/Vanilla JS frontend and adds a small **Node.js + Express** backend.

## What the backend does
- Demo role login API
- Stores emergency cases in `backend/data/db.json`
- Hospital/resource matching API
- Hospital resource update API
- Blood inventory API + O- blood reservation
- Emergency status/timeline APIs
- Serves the frontend from the same server, so there is no CORS setup

## Run on Mac
1. Install Node.js (LTS) if it is not already installed.
2. Open Terminal.
3. Go to this project's `backend` folder:
   `cd path/to/nagpur-medi-resq/backend`
4. Install dependencies:
   `npm install`
5. Start:
   `npm start`
6. Open:
   `http://localhost:3000/login.html`

Demo password: `demo123`

## Demo accounts
- ambulance@mediresq.demo
- hospital@mediresq.demo
- bloodbank@mediresq.demo
- admin@mediresq.demo

## Data
For a hackathon, the JSON file is intentionally simple. It can later be replaced with MongoDB, PostgreSQL, MySQL, or Firebase without changing the basic API structure.
>>>>>>> 52c10a8 (Add fullstack healthcare platform)
