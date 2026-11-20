# EventHub

A full-stack event management platform: organizers publish events, sell tickets, verify UPI
payments and scan attendees in with QR codes; attendees discover events, book tickets,
network with other attendees and manage venues.

**Stack:** React 19 + Vite (frontend) · Node.js + Express + MongoDB/Mongoose (backend) · JWT auth

---

## Features

| Area | Capabilities |
| --- | --- |
| **Events** | Create/edit/delete, drafts, categories, online & in-person events, tags, cover art, search, category/date filters, pagination, calendar view |
| **Ticketing** | Multiple ticket tiers per event, per-tier inventory, free and paid tickets, QR-coded tickets, cancellation |
| **Payments** | UPI-based collection — attendee pays, submits the transaction reference, organizer confirms or rejects; revenue is only counted once confirmed |
| **Check-in** | Manual entry or QR payload parsing, live attendance stats and recent check-in feed |
| **Venues** | Venue directory with capacity, amenities, pricing, map links, reviews and ratings, availability of events at each venue |
| **Networking** | People directory, connection requests, accept/decline, connection lists |
| **Accounts** | Individual or organization accounts, organizer UPI setup, profile and password management |
| **Dashboard** | Role-aware overview: events created, tickets sold, revenue collected, pending payment verifications |

## Repository layout

```
.
├── backend/
│   ├── controllers/     # Route handlers (auth, events, tickets, venues, network, check-in, stats)
│   ├── middleware/      # JWT protect / authorize / optionalAuth
│   ├── models/          # Mongoose schemas: User, Event, Ticket, Venue
│   ├── routes/          # Express routers mounted under /api
│   ├── seed.js          # Demo data seeder
│   └── server.js        # App bootstrap, CORS, error handling, DB connection
└── frontend/
    ├── public/          # Static assets (favicon)
    └── src/
        ├── components/  # Navbar, EventCard, PaymentModal
        ├── context/     # AuthContext
        ├── pages/       # Route-level screens
        └── services/    # Axios API client
```

## Getting started

### Prerequisites

- Node.js 18+
- A MongoDB database (Atlas free tier or a local `mongod`)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGO_URI and JWT_SECRET
npm run seed              # optional: load demo users, venues, events and tickets
npm run dev               # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # only needed when the API is not on localhost:5000
npm run dev                  # http://localhost:3000
```

In development Vite proxies `/api` to `http://localhost:5000`, so no `VITE_API_URL` is required
locally. For a deployed build, set `VITE_API_URL` to the public API URL including `/api`.

### Demo accounts

After `npm run seed` (password `password123` for all):

| Role | Email |
| --- | --- |
| Admin | `admin@eventhub.com` |
| Organizer (Skyline Events) | `alice@eventhub.com` |
| Attendee | `bob@eventhub.com` |
| Attendee | `carol@eventhub.com` |

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Signing secret for access tokens |
| `JWT_EXPIRE` | no | Token lifetime, default `7d` |
| `PORT` | no | Server port, default `5000` |
| `CLIENT_URL` | no | Frontend origin(s) allowed by CORS — comma-separated, e.g. `https://app.example.com,https://app-git-preview.vercel.app` |
| `CLIENT_URLS` | no | Additional allowed origins (same comma-separated format), merged with `CLIENT_URL` |
| `NODE_ENV` | no | `production` on Vercel (serverless export mode) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | deployed builds | API base URL, e.g. `https://api.example.com/api` |

## API overview

All routes are prefixed with `/api`. Protected routes expect `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | public | Create an individual or organization account |
| `POST` | `/auth/login` | public | Obtain a JWT |
| `GET` | `/auth/me` | auth | Current user with connections |
| `PUT` | `/auth/profile` | auth | Update profile fields |
| `PUT` | `/auth/upi` | auth | Set the organizer UPI ID |
| `PUT` | `/auth/password` | auth | Change password |
| `GET` | `/events` | public | List/filter/paginate published events |
| `GET` | `/events/calendar` | public | Events for a given month |
| `GET` | `/events/my` | auth | Events owned by the caller |
| `GET` | `/events/:id` | public | Event detail |
| `POST` | `/events` | auth | Create event |
| `PUT`/`DELETE` | `/events/:id` | owner/admin | Update or delete event |
| `POST` | `/events/:id/like` | auth | Toggle like |
| `POST` | `/events/:id/comments` | auth | Add a comment |
| `POST` | `/tickets/book` | auth | Reserve a ticket (free tickets are auto-confirmed) |
| `GET` | `/tickets/my` | auth | Caller's tickets |
| `POST` | `/tickets/:id/submit-payment` | auth | Submit UPI transaction reference |
| `POST` | `/tickets/:id/confirm-payment` | organizer | Confirm payment and issue QR ticket |
| `POST` | `/tickets/:id/reject-payment` | organizer | Reject a payment submission |
| `DELETE` | `/tickets/:id` | auth | Cancel own ticket |
| `GET` | `/tickets/event/:eventId` | organizer | All tickets for an event |
| `POST` | `/checkin/scan` | organizer | Check in by ticket ID |
| `GET` | `/checkin/event/:eventId/stats` | organizer | Attendance stats |
| `GET`/`POST` | `/venues` | public / auth | List or create venues |
| `GET`/`PUT`/`DELETE` | `/venues/:id` | public / owner | Venue detail, update, delete |
| `POST` | `/venues/:id/review` | auth | Add a review |
| `POST` | `/venues/:id/like` | auth | Toggle like |
| `GET` | `/network/connections` | auth | Connections and pending requests |
| `GET` | `/network/suggestions` | auth | Suggested people |
| `POST` | `/network/connect/:userId` | auth | Send request |
| `PUT` | `/network/accept/:userId` | auth | Accept request |
| `PUT` | `/network/decline/:userId` | auth | Decline request |
| `DELETE` | `/network/disconnect/:userId` | auth | Remove a connection |
| `GET` | `/users` | auth | People directory |
| `GET` | `/stats` | public | Platform totals |
| `GET` | `/stats/organizer` | auth | Revenue and tickets sold for the caller |

## Payment flow

1. Attendee books a paid ticket — the ticket is created in `pending_payment` and inventory is **not** reserved.
2. Attendee pays the organizer's UPI ID and submits the UTR (`pending_payment` + `submitted`).
3. Organizer reviews it in **Dashboard → Attendees**, then confirms or rejects.
4. On confirmation the ticket becomes `active`, inventory is incremented and a QR code is issued.
5. At the door, the organizer scans or pastes the ticket ID in **QR Check-In**; the ticket moves to `used`.

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | Nodemon dev server |
| `backend` | `npm start` | Production server |
| `backend` | `npm run seed` | Reset and populate demo data |
| `frontend` | `npm run dev` | Vite dev server on port 3000 |
| `frontend` | `npm run build` | Production bundle |
| `frontend` | `npm run lint` | ESLint |
| `frontend` | `npm run preview` | Serve the production build |

## Deployment

- **Backend** — deploy `backend/` to Vercel (or any Node host). `vercel.json` routes every request to
  `server.js`, which exports the Express app when `NODE_ENV=production`. Set `MONGO_URI`,
  `JWT_SECRET` and `CLIENT_URL` in the host's environment settings.
- **Frontend** — deploy `frontend/` to Vercel (or Netlify). `vercel.json` rewrites all paths to
  `index.html` for client-side routing. Set `VITE_API_URL` at build time.

## Security notes

- Passwords are hashed with bcrypt (cost 12) and never returned by the API.
- JWTs are signed with `JWT_SECRET`; rotate the secret to invalidate all sessions.
- Authorization is enforced server-side per resource owner (events, venues, tickets, check-in).
- `JWT_SECRET` and `MONGO_URI` belong in environment configuration only — never commit `.env` files.

## Author

N S Karthik Samak
