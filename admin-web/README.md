# GYC Admin (web)

Browser-based admin console for Got You Covered. It is live at **https://mech-intel-app.web.app**.

It uses the same Firebase project as the mobile app. Only accounts whose `users/{uid}` document has
`isAdmin: true` can get in, and `firestore.rules` (repo root) enforces every admin permission on the
server, so the console can't do anything the rules don't allow.

## Features

- **Dashboard:** members, providers, jobs, bookings, applications, reviews and open reports, plus the current app modes
- **Reports:** resolve or dismiss what members flagged. Dismissed reports stop counting against trust.
- **Users:** search and filter; suspend or restore with a reason, verify providers, grant or remove admin
- **Jobs:** hide or restore (kept, but out of the feed and map), or delete permanently
- **Bookings:** filter by status, cancel active bookings
- **Reviews:** find low ratings, delete abusive or fake reviews
- **App settings:** Home announcement, maintenance mode, pause new job posts, show/hide demo content, support email
- **Activity log:** append-only record of every admin action

## Develop

```sh
cd admin-web
npm install
npm run dev        # http://localhost:5173 (talks to the live project)
```

The Firebase web config is read from the repo-root `.env` (the same `EXPO_PUBLIC_FIREBASE_*` values the
app uses). To work against local emulators instead, run `firebase emulators:start --only auth,firestore`
and start Vite with `EXPO_PUBLIC_FIREBASE_USE_EMULATOR=1 npm run dev`.

## Deploy

```sh
cd admin-web
npm run deploy     # builds, then: firebase deploy --only hosting
```

## Adding admins

Sign in to the console, open **Users**, pick the member and choose **Make admin**. The very first admin
has to be set by hand in Firestore (`users/{uid}.isAdmin = true`).
