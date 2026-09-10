# Shreeshakti Ayurveda — Frontend

Doctor-centric practice management UI (Vite + React + Tailwind).

## Users

- **Doctor** — patients, appointments, calendar, reminders, inbox, settings
- **Admin** — approve / reject / suspend doctors (`/admin/login`)

Patients do **not** have accounts or a portal.

## Setup

```bash
npm install
npm run dev   # http://localhost:3000
```

Requires the backend on port 5000. Set `VITE_BACKEND_URL` in `.env` if needed.

## Main routes

| Path | Role |
|------|------|
| `/login`, `/doctor/signup` | Doctor auth |
| `/doctor/dashboard` | Practice overview |
| `/doctor/calendar` | Day / week calendar |
| `/doctor/patients` | Patient records |
| `/doctor/appointments/new` | Schedule visit |
| `/doctor/inbox` | Doctor notifications |
| `/doctor/notifications` | Patient reminder logs |
| `/admin/login`, `/admin/dashboard` | Admin |
