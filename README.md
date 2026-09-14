# Expense Tracker

A React + Vite frontend backed by a small Node API that stores expenses in a
[Turso](https://turso.tech/) (libSQL) database.

## Running

Run the two servers in separate terminals:

```bash
npm run server   # API on http://localhost:3001
npm run dev      # frontend on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, and the backend also sends
permissive CORS headers, so the two can talk despite running on different ports.

The backend connects to Turso using `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
from `.env` (see `.env.example`). On startup it creates the `expenses` table if
it does not exist (and adds the `user_id` column if it's missing from an older
table).

## Authentication

Sign-in is handled by Firebase Auth — Google sign-in or an email/password form
that creates an account for a new address and signs in an existing one. The
frontend is configured with the `VITE_FIREBASE_*` values in `.env`.

Every `/api/expenses*` request must carry the signed-in user's ID token:

```
Authorization: Bearer <firebase-id-token>
```

The backend verifies that token against Firebase's public keys — using
`VITE_FIREBASE_PROJECT_ID` from `.env` to check the token's issuer/audience —
before it touches the database, and rejects the request with `401` if it's
missing or invalid. Every query is scoped to the verified uid; no endpoint
accepts a user id from the client.

### Deploying to a new domain

Two things are easy to miss, because local development never hits either one:

1. **Authorize the domain in Firebase.** Firebase trusts `localhost` out of the
   box but nothing else. Add the deployed domain (e.g. `your-app.vercel.app`)
   under Firebase Console → Authentication → Settings → Authorized domains, or
   Google sign-in fails with `auth/unauthorized-domain`.
2. **Keep the COOP header as-is.** `vercel.json` sets
   `Cross-Origin-Opener-Policy: same-origin-allow-popups`. Firebase's
   `signInWithPopup` watches `popup.closed` to tell when sign-in finished; under
   the stricter `same-origin` value the browser cuts that link, logs
   *"Cross-Origin-Opener-Policy policy would block the window.closed call"*, and
   the popup never resolves. The Vite dev server sends no COOP header at all,
   which is why this only appears once deployed.

### API

| Method | Path                | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/api/expenses`     | List the signed-in user's expenses |
| POST   | `/api/expenses`     | Create an expense for the signed-in user |
| PUT    | `/api/expenses/:id` | Update one of the signed-in user's expenses |
| DELETE | `/api/expenses/:id` | Delete one of the signed-in user's expenses |

An expense is `{ amount: number > 0, category: string, date: "YYYY-MM-DD", note: string }`.
All routes require the `Authorization` header above and return `401` without it.

## About the template

This project provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
