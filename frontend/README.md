# EventHub — Frontend

React 19 single-page app built with Vite. See the [project README](../README.md) for full
setup, environment variables and the API reference.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional in development
npm run dev                  # http://localhost:3000
```

The dev server proxies `/api` to `http://localhost:5000`, so run the backend alongside it.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Structure

- `src/pages` — route-level screens
- `src/components` — shared UI (Navbar, EventCard, PaymentModal)
- `src/context` — `AuthContext` for session state
- `src/services/api.js` — axios instance and typed API helpers
