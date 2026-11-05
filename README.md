# Daylight · Task calendar

An offline-first, device-local task tracker built with React, TypeScript and Vite. No backend, accounts, analytics, remote fonts, or runtime CDN dependencies.

## Develop

Use Node.js 22.12+ (or 24 LTS) and npm.

```sh
npm ci
npm run dev
```

## Production and tests

```sh
npm run build
npx playwright install chromium
npm test
npm run preview
```

The browser suite runs against the production preview in desktop and iPhone-sized Chromium contexts. It covers task creation, editing, deletion, priority, completion/filtering, reload persistence, leap-day navigation, offline reload, and offline writes. If Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when running tests. Mobile emulation does not replace real iPhone Safari testing.

Deploy the contents of `dist/` to an HTTPS static host at its domain root. The generated manifest and Workbox service worker cache the complete application shell. Service workers require HTTPS (localhost is allowed for development). Offline launching is available after an initial online visit finishes caching; the development server does not install the production service worker.

## On iPhone

1. Visit the deployed HTTPS site in Safari while online.
2. Tap **Share → Add to Home Screen** and confirm.
3. Open Daylight from the home screen. After the initial online load, tasks and the calendar work offline.

The app includes standalone display metadata, safe-area spacing, and a 180px Apple touch icon. Verify installed launch and airplane-mode relaunch on a physical iPhone before a release; browser emulation cannot validate Apple's installation UI.

## Features and storage

- Monthly calendar with today shortcut, month navigation, task indicators, and selected-day list.
- All-task view; create/edit/delete tasks with notes, required due date, and low/medium/high priority.
- Complete/reopen tasks, status filters, and completion progress.
- IndexedDB (`daylight`, version 1) stores each task before updating the UI. Storage failures display an error.
- Calendar dates use local `YYYY-MM-DD` strings to avoid UTC date shifts.

All data stays in this browser profile on this device. No synchronization, backup, notifications, or authentication is included. Clearing site data, removing browser storage, private browsing restrictions, or iOS storage eviction can remove tasks. Home-screen and Safari storage behavior varies by iOS version; use the installed app consistently. Treat this prototype as local planning, not a durable backup.
