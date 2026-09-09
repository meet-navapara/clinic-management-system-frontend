# Shreeshakti Ayurveda — Frontend

React frontend for the Shreeshakti Ayurveda appointment booking system. Built with Vite and Tailwind CSS.

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router, Axios

## Prerequisites

- Node.js 18+
- Backend API running on port 5000 (see `../backend/README.md`)

## Installation

```bash
npm install
```

## Scripts

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build
```

## Development

Start the backend first, then run the frontend:

```bash
# Terminal 1 — from backend folder
npm run dev

# Terminal 2 — from frontend folder
npm run dev
```

Open **http://localhost:3000**

The Vite dev server proxies `/api` and `/uploads` requests to `http://localhost:5000`.

## Routes

| Page | URL | Who |
|------|-----|-----|
| Landing | `/` | Public |
| Patient signup | `/register` | New patients |
| Doctor admin setup | `/admin/register` | One-time doctor account |
| Login | `/login` | Patients and doctor |
| Patient dashboard | `/patient/dashboard` | Patients |
| Doctor dashboard | `/doctor/dashboard` | Doctor |
| Appointments | `/appointments` | Logged-in users |
| Profile | `/profile` | Logged-in users |
| Doctor detail | `/doctor/:id` | Patients |

## Project Structure

```
frontend/
├── public/         → Static assets
├── src/
│   ├── components/ → Reusable UI components
│   ├── constants/  → Routes and app constants
│   ├── context/    → Auth context
│   ├── pages/      → Page components
│   └── services/   → API client
├── website-logo/   → Brand logo assets
└── vite.config.js  → Vite config and API proxy
```
