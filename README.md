# 🚗 RideMate Campus

> **A premium, verified campus ride-sharing platform — safe, eco-friendly, and built for students**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

RideMate Campus connects verified students and faculty for safe, daily campus commutes. Drivers post routes, passengers request rides, OTP verification ensures safety, and parent SMS alerts keep families informed — all in one polished, mobile-friendly web app.

---

## ✨ Features

### 🔐 Security & Verification
- Admin approval system for all users before platform access
- Driver verification with license upload + confirmation letter
- OTP verification before every ride starts
- Parent phone number integration for automatic SMS alerts

### 🚘 Smart Ride Management
- **Drivers** — create one-time or recurring rides, accept/reject passenger requests, start rides after OTP check, GPS live tracking
- **Passengers** — search rides by destination, view driver ratings + vehicle info, receive a unique OTP on acceptance, real-time route map

### 📍 Live Tracking
- GPS tracking with Leaflet maps
- Parent tracking portal (read-only link sent via SMS)
- OpenRouteService turn-by-turn directions
- Auto SMS at ride start (Twilio)

### 🌱 Eco Impact Dashboard
- Track total fuel saved (L), CO₂ reduced (kg), and distance shared (km)
- Per-ride breakdown and running goals
- Equivalent trees metric

### 🛡️ Admin Dashboard
- Real-time pending approval alerts (Supabase Realtime)
- One-click approve / reject for users and driver applications
- Search + filter all users by status
- View all rides with status timeline
- No need to touch Supabase directly

### 💳 Payments & Ratings
- Distance-based fare: ₹8/km, auto-calculated on request
- Post-ride feedback and star rating for drivers
- Payment status tracking per ride request

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                     │
├──────────────────────────────────────────────────────────────┤
│  Pages                   │  Components        │  Design       │
│  • Index (Landing)       │  • Navbar          │  Inter font   │
│  • Auth                  │  • SimpleMap       │  Tailwind CSS │
│  • Dashboard             │  • FileUpload      │  shadcn/ui    │
│  • FindRides             │  • RidePayment     │  CSS vars     │
│  • MyRides               │  • FeedbackForm    │  Glassmorphism│
│  • PassengerRides        │  • RideChat        │  Animations   │
│  • LiveTracking          │                    │               │
│  • Profile               │                    │               │
│  • BecomeDriver          │                    │               │
│  • EcoImpact             │                    │               │
│  • AdminDashboard        │                    │               │
└──────────────────────────────────────────────────────────────┘
                               ↕
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Supabase)                         │
├──────────────────────────────────────────────────────────────┤
│  PostgreSQL + RLS        │  Edge Functions                   │
│  • profiles              │  • send-location-sms              │
│  • rides                 │  • send-sos-sms                   │
│  • ride_requests         │  • get-directions                 │
│  • driver_details        │  • publish-location               │
│  • ride_preferences      │                                   │
│  • driver_ratings        │  Storage Buckets                  │
│  • eco_impact            │  • profile-photos                 │
│  • feedback              │  • driver-documents               │
│  • user_roles            │                                   │
│                          │  Realtime Channels                │
│                          │  • profiles, driver_details,      │
│                          │    rides (admin live updates)     │
└──────────────────────────────────────────────────────────────┘
                               ↕
┌──────────────────────────────────────────────────────────────┐
│                    External APIs                              │
├──────────────────────────────────────────────────────────────┤
│  • Nominatim — address geocoding (free, no key needed)       │
│  • Leaflet / OpenStreetMap — map rendering                   │
│  • OpenRouteService — turn-by-turn directions                │
│  • Twilio — SMS notifications to parents                     │
│  • Pusher — real-time location broadcasting                  │
│  • Stripe — payment processing                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/abhishek112005/campus-ride-share.git
cd campus-ride-share

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key

# Run development server
npm run dev
```

### Environment Variables

```env
# Required
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Optional — real-time GPS tracking
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=your_pusher_cluster

# Optional — payments
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## 📁 Project Structure

```
campus-ride-share/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── Navbar.tsx           # Sticky glass navbar with role badges
│   │   ├── SimpleMap.tsx        # Leaflet map component
│   │   ├── FileUpload.tsx       # Supabase Storage upload
│   │   ├── RidePayment.tsx      # Stripe payment flow
│   │   ├── FeedbackForm.tsx     # Post-ride rating
│   │   └── RideChat.tsx         # In-ride chat
│   ├── pages/
│   │   ├── Index.tsx            # Public landing page
│   │   ├── Auth.tsx             # Sign in / Sign up
│   │   ├── Dashboard.tsx        # Personalized home
│   │   ├── FindRides.tsx        # Search & request rides
│   │   ├── MyRides.tsx          # Driver ride management
│   │   ├── PassengerRides.tsx   # Passenger request tracking
│   │   ├── CreateRide.tsx       # Create a new ride
│   │   ├── LiveTracking.tsx     # GPS live tracking
│   │   ├── ParentTracking.tsx   # Read-only parent view
│   │   ├── Profile.tsx          # Profile & preferences
│   │   ├── BecomeDriver.tsx     # Driver application form
│   │   ├── EcoImpact.tsx        # Environmental stats
│   │   └── AdminDashboard.tsx   # Admin control panel
│   ├── integrations/supabase/
│   │   └── client.ts            # Supabase client
│   ├── hooks/
│   │   └── use-toast.ts
│   ├── App.css                  # Design system (tokens, utilities)
│   ├── App.tsx                  # Routes
│   └── main.tsx
├── supabase/
│   ├── functions/               # Edge Functions (SMS, directions, SOS)
│   └── migrations/              # DB migrations
├── vercel.json                  # SPA routing config
├── vite.config.ts
└── tailwind.config.ts
```

---

## 🔑 Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| **React** | UI Framework | 18.3+ |
| **TypeScript** | Type Safety | 5.8+ |
| **Vite** | Build Tool | 5.4+ |
| **Supabase** | Auth, DB, Realtime, Storage | Latest |
| **Tailwind CSS** | Styling | 3.4+ |
| **shadcn/ui** | UI Components | Latest |
| **Leaflet** | Maps | 1.9+ |
| **React Query** | Data Fetching | 5+ |
| **date-fns** | Date Formatting | 3+ |
| **Lucide React** | Icons | 0.462+ |

---

## 🔄 Key User Flows

### Student Sign-Up
```
Register with email → Email verification → Admin approval → Profile setup → Use platform
```

### Become a Driver
```
Fill application → Upload license + letter → Submit parent contact →
Admin reviews documents → Approved → Can create rides
```

### Passenger Requests a Ride
```
Search destination → Browse rides with driver rating →
Request ride → Driver accepts → OTP delivered →
Share OTP at pickup → Live tracking → Complete → Rate driver
```

### Driver Starts a Ride
```
Accept requests → Collect OTPs → Verify in app → 
Parent SMS sent automatically → GPS tracking starts →
Complete → Eco impact logged
```

---

## 🛡️ Admin Setup

To grant admin access, insert one row into `user_roles` in Supabase:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-uuid', 'admin');
```

Find your UUID under **Supabase → Authentication → Users**.  
After re-login, the **Admin** tab appears in the navbar.

---

## 🚀 Deployment

Deployed on **Vercel**. The `vercel.json` handles SPA client-side routing.

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

After deploying, update **Supabase → Authentication → URL Configuration**:
- **Site URL** → your Vercel URL
- **Redirect URLs** → `https://your-app.vercel.app/**`

---

## 🔮 Future Implementations

### Authentication
- [ ] **Google OAuth** — one-click sign-in with Google
- [ ] **GitHub / Microsoft OAuth** — for broader campus login options
- [ ] **Magic link login** — passwordless email login
- [ ] **College SSO** — single sign-on via institutional portals

### Real-Time Features
- [ ] **Live location sharing** — driver location updates every 5s via Pusher/WebSockets
- [ ] **Real-time in-ride chat** — driver ↔ passenger messaging during ride
- [ ] **Live seat availability** — seat count updates instantly as requests are accepted
- [ ] **Push notifications** — browser/PWA notifications for request accepted, ride starting, etc.
- [ ] **Real-time admin dashboard** — live ride monitoring with driver positions on map

### Maps & Navigation
- [ ] **Interactive pickup point selection** — tap on map to set exact pickup
- [ ] **Route preview before requesting** — show the driver's planned route on the ride card
- [ ] **ETA calculation** — live ETA for passenger based on driver's current GPS position
- [ ] **Cluster map view** — admin sees all active rides on a single map

### Payments
- [ ] **UPI integration** — pay via GPay, PhonePe, Paytm
- [ ] **Wallet system** — pre-load credits, auto-deduct on ride completion
- [ ] **Split fare** — divide cost across multiple passengers automatically
- [ ] **Refund flow** — auto-refund on driver cancellation

### Rides & Matching
- [ ] **AI ride matching** — suggest best rides based on location history and preferences
- [ ] **Recurring ride scheduler** — auto-post daily/weekly rides
- [ ] **Waitlist** — join a queue if a ride is full; auto-notify when seat opens
- [ ] **Ride pooling** — match multiple passengers on similar routes

### Safety
- [ ] **SOS button** — one tap sends live location to all emergency contacts via SMS
- [ ] **Background location** — passive tracking even when app is minimised
- [ ] **In-app emergency call** — direct dial to college security from ride screen
- [ ] **Driver behaviour scoring** — flag harsh braking or speeding events

### Student Experience
- [ ] **Leaderboard** — top eco contributors each month
- [ ] **Carbon credit rewards** — earn points redeemable for campus perks
- [ ] **Ride history export** — PDF/CSV of all past rides and expenses
- [ ] **Multi-language support** — Hindi, Telugu, Tamil

### Platform
- [ ] **Native mobile apps** — React Native iOS + Android
- [ ] **PWA with offline support** — use core features without internet
- [ ] **Driver earnings dashboard** — track monthly earnings, rides, and ratings
- [ ] **Analytics panel** — admin graphs for ride volume, popular routes, peak hours

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Abhishek Pothanagari**  
[![GitHub](https://img.shields.io/badge/GitHub-abhishek112005-181717?style=flat&logo=github)](https://github.com/abhishek112005)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) — beautiful, accessible UI components
- [Supabase](https://supabase.com/) — open-source Firebase alternative
- [Leaflet](https://leafletjs.com/) — lightweight, powerful maps
- [OpenRouteService](https://openrouteservice.org/) — free routing API
- [Nominatim](https://nominatim.org/) — free geocoding by OpenStreetMap
- [Twilio](https://www.twilio.com/) — SMS delivery for parent alerts

---

<div align="center">

Built with ❤️ for safer campus commutes

[⬆ Back to top](#-ridemate-campus)

</div>
