# 🗺️ CaterMatch — Roadmap & Status

> *Where the app is, what's left, and the exact next steps to a fully functioning product.*

---

## ✅ What's DONE (working right now)

| Area | Status | Notes |
|---|---|---|
| Auth (register / login / JWT / bcrypt) | ✅ Done | Logged-in users get tokens; demo + real accounts |
| Listings CRUD | ✅ Done | Vendor services + host gigs; soft-delete |
| Radius + category search | ✅ Done | 10/25/50/100 km via Haversine SQL; no external API needed |
| Dual marketplace toggle | ✅ Done | 🚚 Catering & Food Vendors ⇄ 🎪 Event Gigs |
| Real-time chat (Socket.io) | ✅ Done | 1-on-1, read receipts, live inbox |
| Boost system | ✅ Done | 3/7/14-day tiers · Featured badge · top ranking · dev mode |
| Stripe integration | 🟡 Written, needs your keys | Test-mode checkout + verified webhook; runs simulated until keys added |
| Admin / Dev Panel | ✅ Done | Stats, users, staff manager, boost ledger; staff-only |
| Coin-class photos from device | ✅ Done | Pick from camera roll/folders, auto-compressed, stored free in DB |
| Dollar pricing | ✅ Done | "Starting price ($)" instead of $-$$$$ |
| Dark / light mode | ✅ Done | Toggle + persisted, class-based Tailwind |
| 100% free hosting plan | ✅ Documented | README §5 + zero-install embedded DB for dev |

---

## 🚧 WHAT'S LEFT — grouped

### 1. Design & UX (in progress)
- [x] Modern palette + font (Inter) — *this branch*
- [x] Glass header, refined hero, elevated cards, cleaner dashboard
- [ ] Photo **gallery / lightbox** on listing detail (swipe multiple photos)
- [ ] **Keyword search box** on the browse page (API already supports `?search=`)
- [ ] Mobile drawer menu polish (small screens)
- [ ] Empty-state copy + illustrations pass
- [ ] Fine-tune dark-mode surfaces (consistent `slate-900/925/950`)

### 2. Payments & monetization
- [ ] Add your free **Stripe test keys** → flip from simulated to real test checkout
- [ ] Walk a real test payment (`4242…`) through the full webhook → boost activation
- [ ] Add your **live keys** when ready for real revenue
- [ ] (Phase 2) Banner ad slots — header, feed, chat sidebar

### 3. Real users & geolocation
- [ ] **City / GPS → coordinates** on listing create (browser geolocation + free OpenStreetMap geocoding) — no manual lat/lng
- [ ] **My Listings manager** — profile page to edit/soft-delete your posts
- [ ] **Profile editing** — name, phone, avatar upload, change password
- [ ] **Search by postal code** on browse (geocode → radius)

### 4. Product hardening (before public)
- [ ] **Rate limiting** on auth (brute-force protection — e.g., `express-rate-limit`)
- [ ] Input validation pass (lengths, types) on every route
- [ ] HTTPS + secrets hygiene (rotate JWT secret, never commit `.env`)
- [ ] Terms / privacy / cookie-consent pages
- [ ] SEO + social sharing tags (OG meta on listings)
- [ ] Basic automated tests (auth, listings, chat, boosts)

### 5. Launch (free forever)
- [ ] **Deploy backend** to a free host (Supabase **Functions** / Neon + Render free tier)
- [ ] **Deploy frontend** to Cloudflare **Pages** (free CDN + HTTPS)
- [ ] **Real Postgres** via `DATABASE_URL` (the app already supports it — no code change)
- [ ] Custom domain + `cloudflared` tunnel option for self-hosting (Path A in README)
- [ ] Live URL sent to first testers 🎉

### 6. Phase 2 (after launch)
- [ ] Pro Vendor subscriptions ($19–39/mo): verified badges + analytics
- [ ] Supabase Storage / Cloudflare R2 for photos (offload from DB)
- [ ] Email notifications (Resend free tier) for new messages
- [ ] Mobile app via PWA / Capacitor wrapper
- [ ] Reviews & ratings

---

## 🪜 NEXT 10 STEPS (ordered — "fully functioning app")

1. **Finish the modern redesign** and decide light vs dark default (this branch)
2. **Add photo lightbox/gallery** on listing detail
3. **Add search box** to the browse page (uses existing API)
4. **Add GPS/city geocoding** so "post in my city" is automatic and accurate
5. **Build My Listings + Profile page** (edit, delete, avatar, password)
6. **Wire real Stripe test keys** → verify one full checkout → webhook → boost
7. **Harden auth** (rate limiting + validation) — ready for strangers
8. **Deploy backend** to free Postgres host, then **frontend to Cloudflare Pages**
9. **Live smoke test** on the public URL (register → post → search → chat → boost)
10. **Invite first users**, then measure → Phase 2 features

---

## 🧭 HOW TO SWITCH BETWEEN DESIGNS

The redesign lives on a **git branch** so the old look is always one command away:

```bash
git switch main              # old (current "childish") design
git switch modern-redesign   # new modern design
```

> New features land on `modern-redesign`; merge back to `main` whenever you're happy.

---

*CaterMatch — catering, food vendors & event hosts. Built free, stays free.*