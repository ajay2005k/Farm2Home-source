# Farm2Home Marketplace Platform

Farm2Home is a responsive, multi-tenant farmer-to-consumer SaaS marketplace connecting local farmers directly with consumers. It features dedicated portals for Customers, Farmers, and Platform Administrators.

## Key Features

- **Direct Farm-to-Consumer Market**: Fresh produce straight from verified local farms.
- **Multi-Role Portals**: Dedicated customer discovery, farmer inventory/orders dashboard, and SaaS tenant command center.
- **Real Session Management**: Secure role-based authentication and persistent state.
- **Asynchronous Service Layer**: Decoupled service architecture ready for AWS cloud backends.

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

## Production build

```bash
pnpm build
pnpm start
```

## Project structure

```text
app/          Main UI and styling
services/     Customer, farmer, and admin API services
types/        Shared TypeScript models
public/       Images and brand assets
worker/       Cloudflare-compatible runtime entry
```
