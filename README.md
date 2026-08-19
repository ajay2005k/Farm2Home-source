# Farm2Home UI Prototype

Farm2Home is a responsive, frontend-only demonstration model for a farmer-to-consumer SaaS marketplace. It contains customer, farmer, admin, and multi-tenant interfaces using realistic mock data.

This project intentionally has:

- no sign-in or authentication
- no backend or database
- no real payments
- no external API integrations
- no personal data collection

All buttons, dashboards, orders, products, and tenant controls are presentation interactions for a Review 1 demonstration.

## Requirements

- Node.js 22.13 or newer
- pnpm 11 or newer

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Share on the same Wi-Fi network

```bash
pnpm dev:share
```

Find the computer's local IP address and open `http://YOUR-IP:3000` on the other device. Both devices must be on the same network, and the computer's firewall must allow incoming connections.

## Production build

```bash
pnpm build
pnpm start
```

## Project structure

```text
app/          Main UI and responsive styling
mock-data/    Products, orders, and tenant sample records
services/     Customer, farmer, and admin API placeholders
types/        Shared TypeScript models
public/       Images and social-preview assets
worker/       Cloudflare-compatible runtime entry
```

## Demo entry points

- Customer: use Shop, product cards, basket, tracking, or Customer in the Log in role menu.
- Farmer: choose Farmer in the Log in role menu.
- Admin: choose Admin in the Log in role menu, then select Tenants for the SaaS organization view.

The “Log in” control is only a role switcher. It never authenticates or sends user information.
