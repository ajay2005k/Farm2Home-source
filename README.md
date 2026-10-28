# Farm2Home Marketplace Platform

> **Hyperlocal Farm-to-Consumer Platform with Multi-Cluster Sourcing, Dynamic Disintermediation Auditing, and 100% Price Breakdown Transparency.**

---

## 🌟 Overview

**Farm2Home** connects verified regional farmers directly with urban households and apartment communities. By replacing fragmented middlemen and commission-heavy traditional mandis with **Regional Production Clusters** and **Community Delivery Drop Hubs**, the platform ensures:

1. **Farmer Direct Equity**: 65%–72% of every rupee paid goes straight into the farmer's pocket (vs. only 20%–35% in conventional chains).
2. **True Sourcing Freedom**: When a crop is grown across multiple regions, buyers can choose their exact sourcing cluster based on carbon footprint (food miles), harvest freshness, price, or maximum farmer margin.
3. **Radical Transparency**: Every product card and checkout drawer features a full, transparent cost breakdown visualizer comparing Farm2Home against traditional mandi cuts and broker markups.

---

## 🚀 Key Architectural Concepts

### 1. The Two-Sided Cluster Architecture
- **Farm Production & Cold Aggregation Hubs (6 Hubs)**:
  - *Chengalpattu Agro Hub (CAC-01)*: Leafy greens, herbs, and heritage rice.
  - *Pollachi Tender Coconut & Fruit Belt (PCF-02)*: GI-tagged coconut and Robusta bananas.
  - *Nilgiris / Ooty Highland Cold-Chain Hub (NHC-03)*: Cold-climate broccoli, carrots, and strawberries.
  - *Madurai Jasmine & Solanaceae Hub (MJH-04)*: Country tomatoes, shallots, and gourds.
  - *Kanchipuram Heritage Rice & Millet Collective (KRC-05)*: Mappillai Samba and indigenous millets.
  - *Mysore-Wayanad Spice & Tubers Hub (MWH-06)*: Salem turmeric and ginger.
- **Urban Community Delivery Drops (4 Consumer Clusters)**:
  - *Velachery & South Chennai Gated Drop*: Scheduled consolidated morning delivery.
  - *Anna Nagar Central Society Depot*: Daily community aggregate pickup.
  - *OMR Tech-Corridor Smart Locker Hub*: Evening smart locker collection.
  - *Indiranagar & East Bengaluru Drop*: Eco-van consolidated drops.

### 2. Multi-Cluster Sourcing & Comparison Engine
Many staples (such as Country Tomatoes, Robusta Bananas, and Palak Spinach) are harvested across multiple regional hubs. 
- Customers can click **"Compare All Sourcing Clusters"** to open a side-by-side transparency matrix.
- View comparative metrics: **Distance (km)**, **Carbon / Food Miles**, **Harvest Date & Time**, **Farmer Bank Payout**, and **Savings over Mandi Retail**.
- Switch the active source right from the modal or via inline cluster chips on the product cards.

### 3. Radical Financial Transparency (Middlemen Disintermediation)
Every product displays an interactive, color-coded price distribution:
- 🟩 **Farmer Direct Bank Payout** (~65% – 72%)
- 🟦 **Cluster Hub Pre-Cooling & Quality Grading** (~10% – 12%)
- 🟨 **Cold Consolidated Transit** (~8% – 10%)
- 🟪 **Platform & Quality Certification** (~7% – 10%)
- 🟧 **Traditional Mandi Comparison**: Exposes the 40%–55% broker cut removed by Farm2Home.

---

## 💻 Tech Stack & Verification

- **Framework**: Next.js App Router (React 19, TypeScript)
- **Engine**: Vinext / Vite + Cloudflare D1 / SQLite Drizzle ORM Schema
- **Styling**: Modern responsive CSS Design System with glassmorphism, fluid grids, and accessible color tokens
- **Test Suite**: Node.js native test runner (`node --test tests/rendered-html.test.mjs`)
- **Linting**: ESLint 9 (0 errors)

---

## 🛠️ Run Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Vercel deployment

The repository includes `vercel.json` and a `pnpm vercel:build` script for Vercel's Next.js runtime. Import this GitHub repository into Vercel using the **Next.js** framework preset. The build and install commands are specified in `vercel.json`; no environment variables are required for the current UI. `NEXT_PUBLIC_SITE_URL` can be set to a custom domain for canonical social metadata; otherwise Vercel's URL is used.

The current login, catalog, and order screens use sample data and browser-local state. A Vercel deployment serves this interactive prototype, but it does not provide shared accounts or persistent server-side orders. Database-backed SaaS behavior requires a backend deployment before production use.

### Run Tests and Quality Checks

```bash
# Run build and test suite
pnpm test

# Run code linter
pnpm run lint
```

### Share on Local Wi-Fi Network

```bash
pnpm dev:share
```

---

## 👥 Multi-Role Interactive Portals

Farm2Home includes dedicated simulated role views accessible via the navigation header:

- **Customer View**: Explore live produce, switch clusters, inspect price audits, compare sources, and calculate direct farmer payouts in the shopping basket.
- **Farmer Portal**: Track harvest submissions, monitor payouts, and view cluster collection schedules.
- **Admin & SaaS Tenant Hub**: Monitor cross-cluster logistics, active tenants, fulfillment rates, and system-wide carbon reduction metrics.

---

## 📄 License
MIT License. Created for the Farm2Home Project.
