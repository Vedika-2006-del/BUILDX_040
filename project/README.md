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

## Emergency Twist Mode
Open `⚡ Twist Mode` in the sidebar (`surge.html`) to demo how the same backend and matching engine adapt to all four hackathon twists:

1. **Emergency Surge** (highway accident, many patients at once) — a bulk intake form sends every patient to `POST /api/emergencies/bulk`. The backend triages by severity (CRITICAL → URGENT → STABLE), allocates hospitals in that priority order, and auto-dispatches the nearest free ambulance from the fleet in `backend/data/db.json`.
2. **Network Blackout** (no internet) — the "Network Blackout" tab detects `navigator.onLine` (or a manual "Simulate Blackout" toggle) and, while offline, saves new emergencies to `localStorage` instead of failing, and generates an SMS-style fallback message. A "Reconnect & Sync" button flushes the queue to the backend once the connection is back.
3. **Hospital Overflow** (all hospitals full) — every hospital now has `bedsAvailable`/`bedsTotal`. When no hospital has a free bed (or the clinical requirements aren't met), `matchWithOverflow()` in `server.js` automatically redirects the patient to the nearest emergency camp or partner hospital from `db.camps`. The "Hospital Overflow" tab shows live capacity bars for both.
4. **Golden Hour** (first 60 minutes matter most) — every emergency now carries a `goldenHourDeadline` (createdAt + 60 min). The "Golden Hour" tab shows a live countdown for the most recent case (turning yellow, then red, as time runs out) plus the live ambulance fleet, since the fastest lever on response time is auto-dispatching the nearest free ambulance instead of a manual call.

New/changed backend endpoints: `POST /api/emergencies/bulk`, `GET /api/camps`, `GET /api/ambulances`. Existing endpoints are unchanged and still work exactly as before.
