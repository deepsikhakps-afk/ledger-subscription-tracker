# Ledger — Subscription & Bill Tracker

A no-database, browser-only tool for tracking recurring subscriptions and bills — Netflix, gym memberships, SaaS tools, utilities, anything that renews. See your total monthly/yearly spend at a glance, a spend-by-category chart, and get browser notifications before a renewal hits.

## Features

- **Add/edit/delete subscriptions** — name, price, billing cycle (weekly/monthly/yearly), category, and next renewal date
- **Summary dashboard** — monthly total, yearly total, active subscription count, and the next upcoming renewal
- **Spend-by-category chart** — a hand-drawn Canvas bar chart (no charting library) breaking down monthly cost by category
- **Sortable list** — by renewal date, price (high→low or low→high), or name
- **Renewal badges** — subscriptions renewing within 3 days are flagged inline
- **Browser notifications** — opt in per-subscription to get a native notification 2 days before renewal (via the Notifications API)
- **Persistent storage** — everything saved to `localStorage`, no account, no server
- **Toast confirmations** for add/update/delete actions

## Tech Stack

- HTML5, CSS3 (Google Fonts: Space Grotesk + JetBrains Mono, no framework)
- Vanilla JavaScript (ES6+)
- Canvas 2D API for the category chart (no Chart.js dependency)
- **Notifications API** for renewal reminders
- No database, no backend, no build step

## Project Structure

```
bill-tracker/
├── index.html          # App shell: dashboard, chart, list, add/edit modal
├── css/
│   └── style.css        # Dark theme, cards, modal, chart styling
├── js/
│   ├── store.js           # localStorage CRUD for subscriptions
│   ├── chart.js            # Canvas bar chart renderer
│   └── app.js                # UI wiring, calculations, notifications
└── README.md
```

## Setup & Running

1. Download/clone this folder.
2. Open `index.html` directly in a browser, or serve it locally:
   ```bash
   cd bill-tracker
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000`, click **+ Add subscription**, and fill in the details.
4. Check "Remind me 2 days before renewal" and allow notifications when prompted to get a browser alert as the date approaches.

## How It Works

1. **Storage**: subscriptions are stored as an array of objects (`{id, name, price, cycle, category, nextRenewal, reminder}`) in `localStorage` via `store.js`, with simple CRUD helpers.
2. **Cost normalization**: since subscriptions can bill weekly, monthly, or yearly, `monthlyEquivalent()` converts every cycle to a monthly figure (yearly ÷ 12, weekly × 4.345) so totals and sorting are apples-to-apples.
3. **Chart**: `chart.js` draws a simple bar chart directly on a `<canvas>` — bar heights are scaled relative to the highest-spending category, with matching colored legend swatches.
4. **Reminders**: on each render, `checkDueReminders()` checks subscriptions with reminders enabled and exactly 2 days left, firing a `Notification` if permission was granted. A `sessionStorage` flag prevents duplicate notifications within the same session.
5. **Renewal badges**: any subscription renewing within 3 days gets an inline "Xd left" or "due" badge for quick visual scanning.

## Browser Notes

- The Notifications API requires the user to explicitly grant permission — this is requested the first time a subscription with reminders enabled is saved.
- Notifications work best when the tab stays open or the browser is allowed to run in the background; behavior varies by OS/browser.

## Possible Extensions

- Recurring reminder checks via a Service Worker (so alerts fire even with the tab closed)
- CSV export of subscription data
- Multi-currency support
- "Pause" a subscription without deleting it
- Spending trend chart over multiple months

## License

Free to use for academic/educational purposes.
