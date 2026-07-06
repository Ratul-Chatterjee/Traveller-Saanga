# Traveller Saanga

> **AI-Powered Tourism Decision Platform for Odisha**  
> A full-stack, Cloud Run-hosted travel companion with curated destinations, smart itinerary planner, interactive Google Maps, live festival calendar, and per-user state persistence with Firebase.

---

## 1. Brief about the idea

Traveller Saanga is a decision intelligence platform for Odisha tourism. It aggregates 42+ curated destinations, computed festival calendars, and real-time routing data into a single interface that helps travellers plan multi-stop itineraries, estimate budgets, discover festivals, and explore places through an interactive map — all secured with Firebase Authentication and persisted per user.

---

## 2. How the solution addresses the problem statement

**Approach**: We built a full-stack application on Google Cloud Run that transforms raw destination data, holiday calendars, and routing information into actionable travel decisions. The platform uses:

- **Firebase Authentication** for secure, per-user state management (cart, wishlist, trip settings)
- **Firebase Firestore** for cloud-synced user persistence with automatic local JSON fallback
- **OSRM (Open Source Routing Machine)** as a free, scalable routing proxy for real driving distances between destinations
- **Google Maps JavaScript API** for interactive map visualisation with place markers and route polylines
- **Astronomical computation** for generating Odisha's official holiday calendar on-the-fly without external dependencies

**Real-world impact**: Travellers and local tourism stakeholders can make informed decisions like which destinations to visit, in what order, at what cost, and during which festivals, reducing planning time from hours to seconds.

**Architecture**: React + Vite frontend served statically by an Express backend on Cloud Run. The backend proxies routing requests to OSRM, computes holidays server-side, and syncs user state to Firestore. All components auto-scale on Cloud Run with zero cold-start overhead.

---

## 3. USP & Differentiation

| Aspect | Existing travel planners | Traveller Saanga |
|---|---|---|
| Route optimisation | Manual or sequential ordering | Nearest-neighbour + 2-opt refinement with real driving distances |
| Budget + time estimation | Separate tools | Unified calculator covering travel, food, entry fees, and visit hours |
| Festival alignment | Not integrated | Live holiday data with automatic trip-overlap matching |
| State persistence | Session-only | Firebase Auth + Firestore sync across devices |
| Deployment | Manual hosting | One-command Cloud Run deploy with Docker |

---

## 4. Features

| Feature | Details |
|---|---|
| **42+ Odisha destinations** | Curated places with ratings, fees, durations, images, and descriptions |
| **Smart itinerary planner** | Nearest-neighbour + 2-opt route optimisation, real driving distances via OSRM |
| **Expense calculator** | Travel (₹12/km), food (₹600/person/day), entry fees — with budget tracking |
| **Festival calendar** | Live computed Odisha holidays with type filters and trip-overlap suggestions |
| **Interactive Google Maps** | Place markers, info windows, and route polylines |
| **Per-user cart & wishlist** | Synced to Firebase Firestore + local fallback |
| **Firebase Authentication** | Google Sign-In + email/password registration and login |
| **Dark / light mode** | Persistent theme preference |
| **Search & filters** | Region, type, entry fee, and keyword search across destinations |
| **Responsive design** | Optimised for mobile and desktop |

---

## 5. Technologies used

| Layer | Technology | Why it was chosen |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Fast builds, type safety, component ecosystem |
| Styling | TailwindCSS v4, Radix UI | Utility-first styling with accessible primitives |
| Maps | Google Maps JavaScript API | Industry-standard mapping with markers, info windows, and polylines |
| State management | TanStack Query, React context | Server-state caching + lightweight global state |
| Routing (client) | Wouter | Minimal, hook-based router with zero config |
| Backend | Node.js 20, Express 4 | Mature ecosystem, easy Cloud Run deployment |
| Auth | Firebase Authentication | Google + email/password, token-based API security |
| Database | Firebase Firestore | Serverless, real-time sync, auto-scaling — with local JSON fallback for development |
| Routing (server) | OSRM (openstreetmap.org) | Free, no API key needed, driving-distance API |
| Holiday engine | astronomia library | Server-side astronomical computation, no external API dependency |
| Hosting | Google Cloud Run, Docker | Auto-scaling containerised deployment, pay-per-use |
| CI/CD | Google Cloud Build | Automated image building and container registry |

---

*Made for Odisha tourism.*
