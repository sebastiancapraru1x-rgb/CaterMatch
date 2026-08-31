# 🚚🎪 CaterMatch

**The open marketplace for food trucks, mobile caterers, and event hosts.**

A two-sided classifieds marketplace — inspired by **Facebook Marketplace** and **Craigslist** — connecting mobile food vendors (food trucks, ice cream carts, pop-ups) directly with event hosts (birthdays, corporate parties, weddings).

> **Key differentiators:** 100% free direct communication • No booking commissions • Zero transaction friction

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Monetization Model](#2-business--monetization-model)
3. [Core Features & UX Flow](#3-core-features--ux-flow)
4. [Technical Stack](#4-technical-stack)
5. [Database Schema](#5-database-schema)
6. [API Route Map](#6-api-route-map)
7. [Project Folder Structure](#7-project-folder-structure)
8. [Build Roadmap](#8-build-roadmap)
9. [Getting Started](#9-getting-started)

---

## 1. Executive Summary

| | |
|---|---|
| **App Name** | CaterMatch |
| **Tagline** | The open marketplace for food trucks, mobile caterers, and event hosts. |
| **Core Concept** | Two-sided classifieds marketplace connecting food vendors with event hosts |
| **Inspiration** | Facebook Marketplace + Craigslist, rebuilt for the food-truck economy |
| **Key Differentiator** | 100% free direct communication — CaterMatch never takes a booking cut |

### The Problem
- **Hosts** (birthday parties, corporate events, weddings) have no easy way to discover and contact local food trucks & mobile caterers — they rely on Google searches and word-of-mouth.
- **Vendors** (food trucks, ice cream carts, pop-ups) carry excess capacity and have no low-friction channel to find events in their area — existing platforms charge commissions and gate communication.

### The Solution
A single marketplace with **two browsing sides**:
- 🚚 **Vendors post "Service Available" listings** → hosts find them by location & cuisine.
- 🎪 **Hosts post "Event Gig" requests** → vendors find paying gigs in their radius.
- 💬 Both sides communicate **directly, free, and in real-time** via in-app chat.

### How CaterMatch Makes Money (without touching transactions)
Revenue comes from **optional visibility boosts**, **display ads**, and future **Pro subscriptions** — never from booking commissions. Hosts and vendors negotiate and pay each other directly, on their own terms.

---

## 2. Business & Monetization Model

### 2A. Paid Listing Boosts — Primary Revenue
Users (Vendors **or** Hosts) pay a flat fee to pin their listing to the **top of search results** in their area. Boosted listings receive a **"Featured" badge**, highlighted UI borders, and top-tier search ranking.

| Tier | Duration | Price |
|---|---|---|
| **Tier 1** | 3-Day Boost | **$4.99** |
| **Tier 2** | 7-Day Boost | **$9.99** |
| **Tier 3** | 14-Day Boost | **$17.99** |

**Boost purchase flow:**
1. User clicks "Boost Listing" on their own listing.
2. Server creates a **Stripe Checkout Session** for the chosen tier.
3. Stripe redirects the user to payment → user completes checkout.
4. `checkout.session.completed` webhook fires → server:
   - Records a row in `boost_transactions`,
   - Sets `is_boosted = TRUE`,
   - Sets `boost_expires_at = NOW() + N days`.
5. Expired boosts are auto-downgraded (query checks `boost_expires_at < NOW()`).

### 2B. Display / Banner Ads
Strategic ad spots sold to local, event-adjacent businesses (party rentals, venues, wedding planners):
- **Header** banner
- **Search feed** in-feed cards
- **Chat sidebar** placement

### 2C. Phase 2 — "Pro Vendor" Subscriptions
Optional monthly subscriptions ($19 – $39/mo) with **verified badges** and **listing analytics** (views, message click-throughs, profile visits). Managed with Stripe Subscriptions + the same webhook infrastructure.

---

## 3. Core Features & UX Flow

### A. Dual Marketplace Toggle
A prominent switch at the top of the main screen flips the entire browse experience:

```
[ 🚚 Browse Food Trucks ]  ⇄  [ 🎪 Browse Event Gigs ]
```

- **Browse Food Trucks** → shows `vendor_service` listings (hosts searching for caterers).
- **Browse Event Gigs** → shows `host_gig` listings (vendors searching for paid work).

Both modes share the same search UI, radius filters, listing cards, and chat — only the underlying `listing_type` filter changes.

### B. Geolocation & Radius Search
- Users pick a location (city / postal code, or browser geolocation).
- Radius options: **10 km · 25 km · 50 km · 100 km**.
- Distance computed with **PostGIS** (or the SQL `haversine_km()` helper in `schema.sql`).
- **Category filter:** Ice Cream, Tacos, BBQ, Desserts, Coffee/Beverage, Pizza, Vegan, Halal, and more.

### C. Listing Creation System
**Post as a Vendor (Service Available):**
| Field | Type |
|---|---|
| Truck/Business name | text |
| Category | select |
| Description | textarea |
| Photos | image upload (array) |
| Price tier | $-$$$$ |
| Service radius | km |
| Location | city + lat/lng |

**Post as a Host (Gig / Event Request):**
| Field | Type |
|---|---|
| Event title | text |
| Event date | date picker |
| Location | city + lat/lng |
| Expected guest count | number |
| Budget estimate | currency |
| Food preferences | text/select |

### D. Direct In-App Messaging
Real-time, 1-on-1 chat between hosts and vendors to negotiate pricing, terms, and availability **directly** — no platform mediation.
- Any logged-in user can tap **"Message"** on a listing → creates (or reuses) a `conversation`.
- Messages stream instantly over **Socket.io** rooms keyed by `conversation_id`.
- Unread counts, read receipts (`is_read`), and `last_message_at` sorting for the inbox.

---

## 4. Technical Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React (Vite) | SPA UI |
| Styling | Tailwind CSS | Utility-first design system |
| Icons | Lucide React | Crisp, consistent iconography |
| HTTP | Axios | REST API calls |
| Realtime client | Socket.io-client | Live chat |
| Routing | React Router | Page navigation |
| **Backend** | Node.js + Express.js | REST API + webhooks |
| **Database** | PostgreSQL + PostGIS | Persistence + geo-radius queries |
| **Realtime** | Socket.io | Instant 1-on-1 chat |
| **Payments** | Stripe Checkout + Webhooks | Self-serve listing boosts |
| **Auth** | JWT + bcrypt | Stateless auth + password hashing |

### Cross-cutting concerns
- **ES modules** throughout; `dotenv` for configuration.
- **JWT middleware** guards all protected routes (create/edit/delete listing, messaging, boosts).
- **Stripe webhook signature verification** before mutating boost state.
- CORS locked to `CLIENT_ORIGIN`.

---

## 5. Database Schema

Five tables live in `server/db/schema.sql` (with enums, FKs, indexes, and a `haversine_km()` helper):

```
users ───────────────┐
                     ▼
                listings ─────┐
                     ▲        │
                     │        ▼
                 conversations ──► messages (1:N)
                     │
                     ▼
            boost_transactions  (listings.user_id, Stripe refs)
```

- **users** — auth + profile (email, bcrypt hash, name, phone, avatar).
- **listings** — the heart: dual `listing_type` (vendor_service / host_gig), location + radius, nullable host-gig fields (event_date, expected_guests, budget_estimate), nullable vendor fields (price_tier, photos[]), and boost columns.
- **conversations / messages** — 1:N chat; inbox sorted by `last_message_at`, unread via `is_read`.
- **boost_transactions** — audit + revenue ledger for every Stripe payment.

**Indexes:** geo (lat/lng), listing type, boosted/expiry, category, status, conversation participants, message ordering.

---

## 6. API Route Map

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (bcrypt hash, returns JWT) |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Current user (protected) |

### Listings
| Method | Route | Description |
|---|---|---|
| GET | `/api/listings` | Search: `?type=…&category=…&radius=…&lat=…&lng=…` |
| GET | `/api/listings/:id` | Listing detail |
| POST | `/api/listings` | Create listing (protected) |
| PUT | `/api/listings/:id` | Update own listing (protected) |
| DELETE | `/api/listings/:id` | Delete own listing (protected) |

### Messaging
| Method | Route | Description |
|---|---|---|
| POST | `/api/conversations` | Start/reuse conversation with listing owner |
| GET | `/api/conversations` | My inbox (sorted by last_message_at) |
| GET | `/api/conversations/:id/messages` | Message history |
| POST | `/api/conversations/:id/messages` | Send message (also emits Socket.io event) |

### Boost & Stripe
| Method | Route | Description |
|---|---|---|
| POST | `/api/boosts/checkout` | Create Stripe Checkout Session (protected) |
| POST | `/api/stripe/webhook` | `checkout.session.completed` → activate boost |

### Socket.io events
- `conversation:join` / `conversation:leave` — joins user to room `conv:<id>`
- `message:new` — delivers new message to all room members
- `message:read` — marks a message read

---

## 7. Project Folder Structure

```
CaterMatch/
├── README.md                     ← this blueprint
├── docker-compose.yml            ← local Postgres + PostGIS
├── .gitignore
├── .env.example
│
├── server/                       # Node.js + Express + Socket.io
│   ├── package.json
│   ├── db/
│   │   └── schema.sql            ← full PostgreSQL schema
│   └── src/
│       ├── index.js              ← Express + Socket.io bootstrap
│       ├── config/
│       │   ├── db.js             ← pg Pool (DATABASE_URL)
│       │   ├── stripe.js         ← Stripe client
│       │   └── socket.js         ← Socket.io wiring
│       ├── middleware/
│       │   ├── auth.js           ← JWT guard
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── listings.routes.js
│       │   ├── conversations.routes.js
│       │   ├── messages.routes.js
│       │   └── boosts.routes.js  ← checkout + Stripe webhook
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── listings.controller.js
│       │   ├── conversations.controller.js
│       │   └── boosts.controller.js
│       └── services/
│           ├── geo.service.js    ← radius query builder (haversine / PostGIS)
│           └── boost.service.js  ← activate/expire logic
│
└── client/                       # React (Vite) + Tailwind
    ├── package.json
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               ← routes + providers
        ├── pages/
        │   ├── BrowsePage.jsx    ← dual toggle + search + feed
        │   ├── ListingDetailPage.jsx
        │   ├── CreateListingPage.jsx
        │   ├── MessagesPage.jsx  ← inbox + chat window
        │   ├── AuthPage.jsx      ← login/register
        │   └── BoostPage.jsx     ← Stripe checkout launch
        ├── components/
        │   ├── MarketplaceToggle.jsx
        │   ├── RadiusPicker.jsx
        │   ├── CategoryFilter.jsx
        │   ├── ListingCard.jsx   ← Featured badge & border
        │   ├── ChatWindow.jsx
        │   └── AdBanner.jsx
        ├── context/
        │   ├── AuthContext.jsx
        │   └── SocketContext.jsx
        └── services/
            ├── api.js            ← axios instance (JWT interceptor)
            └── socket.js         ← socket.io-client singleton
```

---

## 8. Build Roadmap

| Milestone | Scope | Exit criteria |
|---|---|---|
| **M0 — Foundation** | Repo, docker compose, schema.sql, Express bootstrap, JWT auth, Vite + Tailwind shell | User can register/login; DB up |
| **M1 — Listings CRUD** | Create/read/update/delete listings; radius + category search | Geo-filtered feed works (10/25/50/100 km) |
| **M2 — Marketplace Toggle** | Dual browse UI + type-aware listing forms | One toggle flips the whole feed |
| **M3 — Real-time Chat** | Conversations, messages API, Socket.io rooms | Messages appear instantly both directions |
| **M4 — Monetization** | Stripe Checkout, webhook, boost activation UI, Featured badges/ranking | Paying a boost pins a listing to top |
| **M5 — Ads & Polish** | Banner/infeed ad slots, responsive design, empty states, seeded demo data | Production-ready MVP |
| **Phase 2** | Pro Vendor subscriptions, verified badges, analytics, mobile apps | — |

### Suggested M0 quickstart
```bash
# 1. Start the database
docker compose up -d

# 2. Apply the schema
cd server
cp ../.env.example .env           # then fill real values
npm install
npm run db:init                   # psql $DATABASE_URL -f db/schema.sql
npm run dev                       # API on :4000

# 3. Start the client
cd ../client
npm install
npm run dev                       # App on :5173
```

---

## 9. Getting Started

```bash
git clone <url> CaterMatch
cd CaterMatch
docker compose up -d              # Postgres + PostGIS
cp .env.example server/.env       # configure DATABASE_URL, JWT_SECRET, Stripe keys

# Backend
cd server && npm install && npm run db:init && npm run dev

# Frontend
cd client && npm install && npm run dev
```

Open **http://localhost:5173** → register → post a listing → flip the marketplace toggle → start chatting 🚀

---

*CaterMatch — the open marketplace for food trucks, mobile caterers, and event hosts. Built free, stays free. 📍🚚🎪*
<!-- END -->