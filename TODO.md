# TODO: StellarMartBD - Premium Admin Dashboard Production Blueprint

This production-grade action plan outlines the architectural migrations and frontend component features required to transform all remaining static/demo views within the Admin Dashboard into live, zero-demo, real-time data screens powered directly by Supabase, Vercel APIs, and edge system streams.

---

## 1. Analytics & Insights: Core Data Infrastructure Sync 📈
- [ ] **Migrate Mock JSONs:** Audit and replace all hardcoded analytics numbers inside `Reports`, `User Intelligence`, and `Marketing Intel` with dynamic hooks querying live database schemas.
- [ ] **Global Date Filter Synchronization:** Ensure the `Last 30 days`, `Last 7 days`, and Custom range dropdown filters correctly inject parameters into backend API route parameters to dynamically compute totals.

---

## 2. Dynamic Reports Menu (`image_3befe0.jpg`) 📊
- [ ] **Live Summary Counters:** Replace the static values (currently showing ৳0, 0, etc.) with aggregated PostgreSQL queries (`SUM(total_amount)`, `COUNT(id)`) from `orders` and `order_items` tables.
- [ ] **Dynamic Report Generation engines:**
    - **Sales Report:** Generates live summaries of gross revenue, taxes, platform fees, and net payouts.
    - **Product Report:** Real-time summary displaying stock level statuses, low-stock warnings, and top-moving items.
    - **Customer Report:** Live tracking of new user registrations vs returning buyers metrics.
    - **Category Report:** Breakdown of total orders sorted by dynamic category buckets.
- [ ] **Real PDF & View Generation:** Implement a serverless package (e.g., `jspdf` or `pdfkit`) to generate downloadable formatted documents on-the-fly containing real database rows.

---

## 3. User Intelligence Engine (`image_3bf305.png`) 🧠
- [ ] **Dynamic Funnel Computation:** Replace static percentages in the User Behavior Funnel with live calculated conversion metrics:
    - **Viewed Product:** Total unique page view logs where route matches `/product/*`.
    - **Added to Cart:** Unique count of user sessions triggering `add_to_cart` events.
    - **Completed Purchase:** Absolute successful transaction count.
- [ ] **Live Session & Traffic Stats:** Hook into Vercel Web Analytics or custom session tracking tables to calculate real Active Users, Avg Session Duration, and Bounce Rates.
- [ ] **Top Active Users Widget:** Fetch users ordered by their latest session action log timestamps. Display real names, total visits counts, live timestamps, and accurate status toggles (active/idle).

---

## 4. Marketing Intelligence Menu (`image_3bf66a.png`) 🎯
- [ ] **Live Campaign Status Tracks:** Map Active Campaigns directly to a `marketing_campaigns` configuration table to stream real budgets, status values (active/paused), and dynamically calculated ROI formulas.
- [ ] **Channel Performance Metric Sync:** Distribute Traffic Source channels (Organic, Social, Direct) using live referrer strings captured during user entry hooks.
- [ ] **Top Performing Products Feed:** Fetch products grouped by order volume, calculated dynamically with a SQL join between `products` and completed `order_items`.

---

## 5. System Health Menu (Advanced Infrastructure Metrics) 🖥️
- [ ] **UI Overhaul & Aesthetics:** Design a dashboard layout utilizing real-time updating area charts, micro-progress indicator rings, and active color-coded health states (Green: Optimal, Yellow: Warning, Red: Critical).
- [ ] **Live Resource Streams:**
    - **Vercel Serverless Monitoring:** Fetch execution metrics, functions runtime invocations, and edge middleware latency numbers via Vercel's REST API.
    - **Supabase Instance Telemetry:** Integrate Supabase management API metrics or utilize client-side database ping execution timing hooks to measure live database read/write latencies.
    - **Storage Usage Tracker:** Query live bucket sizes (`vendor-logos`, `product-images`) via Supabase Storage metrics to show exact disk usages, capacity caps, and remaining allocated storage slots.

---

## 6. Supabase-Inspired Whitish Database Explorer 🗄️
- [ ] **Tabular Spreadsheet Layout:** Build an interactive grid view mimicking the Supabase dashboard layout while preserving the sleek whitish theme of StellarMartBD.
- [ ] **Horizontal Scroll Enablement:** Structure the main table wrapper with an explicit `overflow-x: auto;` css configuration to ensure clean horizontal scrolling over massive, wide data-column schemas.
- [ ] **Live Schema Discovery:** Fetch database metadata dynamically using secure Supabase RPC functions mapping schema definitions (`public.tables`, `columns`) into responsive data table columns.

---

## 7. Advanced Cache Management Panel ⚡
- [ ] **Cache Registry Overview:** List all cached edge assets, Next.js incremental static regeneration (ISR) routes, and static pages managed under Vercel CDN routing.
- [ ] **Cache Invalidation Tools:**
    - Add a **"Purge Global CDN Cache"** button firing revalidation webhooks.
    - Add a **"Targeted Route Purge"** form to purge specific static URLs (e.g., clearing stale info on `/product/123`).
- [ ] **Live Hit/Miss Analytics:** Display real-time streaming line charts measuring Cache Hit Rate percentage vs Cache Miss frequencies using edge logging middleware.

---

## 8. Database Backup & Restore Control Center 💾
- [ ] **Backup History Log Ledger:** Display an active log table listing automated backups generated via Supabase PostgreSQL pg_dump processes. Show accurate filesizes, creation times, and checksum strings.
- [ ] **On-Demand Snapshot Trigger:** Implement an explicit "Trigger Manual Snapshot Backup" configuration initiating secure administrative storage actions.
- [ ] **Live Status Indicators:** Use smooth flashing animations showing real progress states during backup processing routines (e.g., `Idle` -> `Dumping Schema` -> `Uploading Snapshot` -> `Success`).

---

## 9. Deployment Build Logs Streamer 🛠️
- [ ] **Vercel Build Hook Pipeline:** Establish live WebSocket or continuous long-polling connections to Vercel's Deployment Events API endpoint (`/v13/deployments/{id}/events`).
- [ ] **Streaming Console UI:** Embed a dark-themed or highly contrasted code-log terminal block displaying raw live compile-time logs, warnings, dependency installs, and edge function packaging statuses directly as they compile on Vercel.

---

## 10. Router Page Logs & Live User Activity Trails 📜
- [ ] **Page Logs Engine:** Log all unique routing request paths handled by Next.js middleware into a performance log schema. Display incoming paths, response payload sizes, loading latencies, and browser agent variants.
- [ ] **Activity Logs Interface:** Build a centralized administrative monitoring audit feed capturing critical actions taken across the system:
    - *Example logs:* "Vendor [X] updated Product [Y]", "Admin sent Broadcast Notification", "User [Z] changed password".
    - Ensure infinite scroll pagination architecture streams new security events using Supabase `.on()` Realtime broadcast channels.

---

## 11. Global Site Settings & SEO Metadata Master Panel 🌐
- [ ] **Live Metadata Form Configurator:** Create live forms to manipulate core meta attributes: Site Title, Meta Descriptions, Global OpenGraph Card Images, and structural Favicons.
- [ ] **Supabase Storage Sync:** Instantly save custom uploaded OpenGraph banners to Supabase buckets and refresh site-wide config metadata fields.
- [ ] **Robots & Sitemap Generation:** Add manual control buttons allowing administrators to trigger dynamic updates to `robots.txt` and rebuild automated XML sitemaps mapped directly across production routing environments.