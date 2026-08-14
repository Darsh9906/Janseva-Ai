# 🛡️ JanSeva-AI — Hyperlocal Problem Solver

An AI-powered community issue management platform. Citizens **report, validate, track and resolve** civic problems — potholes, water leaks, broken streetlights, waste and more — through collaboration, real data and agentic automation.

Built with **Next.js 16, React 19, TypeScript, Tailwind v4, Firebase and Google Gemini**.

---

## ✨ Features

| # | Feature | Status |
|---|---------|--------|
| 1 | **AI Image & Video Reporting** — Gemini Vision detects issue type, severity, department & confidence | ✅ |
| 2 | **Interactive Map** — Google Maps with severity-coloured markers, info windows, live data | ✅ |
| 3 | **Community Validation** — confirm / upvote / flag, with a verification status engine | ✅ |
| 4 | **Issue Timeline** — Reported → Verified → Assigned → In Progress → Resolved, with timestamps | ✅ |
| 5 | **Gamification** — Hero Points, tiers & badges (Top Reporter, Problem Solver, …) | ✅ |
| 6 | **AI Civic Assistant** — floating Gemini chatbot grounded in live issue data | ✅ |
| 7 | **Duplicate Detection** — nearby same-category reports flagged before submit | ✅ |
| 8 | **Impact Analytics** — dashboard with charts, hotspots & AI-generated insights | ✅ |
| 9 | **Admin Panel** — officers assign & advance status, view performance metrics | ✅ |
| 10 | **Auth** — Firebase Google sign-in, per-user accountability | ✅ |

### Agentic AI (Google Gemini)
- **Vision Agent** (`agents/civicInspector.ts`) — analyses the photo → structured issue.
- **Duplicate Detector** (`agents/duplicateDetector.ts`) — compares against nearby reports.
- **Civic Assistant** (`agents/civicAssistant.ts`) — answers natural-language questions.
- **Impact Analytics** (`agents/impactAnalytics.ts`) — generates civic insights.
- A resilient Gemini service (`services/gemini.ts`) with a **model fallback chain + retries**.

---

## 🚀 Quick start

```bash
# 1. install
npm install

# 2. configure environment
cp .env.example .env.local      # then fill in the values (see below)

# 3. run
npm run dev                     # http://localhost:3000
```

Until Firebase keys are present the app runs fine and shows friendly
“not configured” states, so you can preview the UI immediately.

### Environment variables (`.env.local`)

```bash
GEMINI_API_KEY=                       # https://aistudio.google.com/apikey
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=      # enable "Maps JavaScript API"

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 🔥 Firebase setup (one-time)

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method → Google → Enable.**
3. **Firestore Database → Create database** (production mode).
4. **Storage → Get started.**
5. **Project settings → Your apps → Web** → copy the config into `.env.local`.
6. Deploy the included rules & indexes:

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Collections are created automatically on first write — **no seed/dummy data**.
Real data appears as users report. To make yourself an **officer/admin**, open
the `users/{yourUid}` doc in Firestore and set `role: "admin"`.

---

## 🗂️ Directory structure

```
src/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Landing
│   ├── report/               # Report flow (upload → AI → GPS → persist)
│   ├── issues/               # Feed
│   │   └── [id]/             # Detail: timeline, comments, verification
│   ├── map/                  # Google Maps (Firestore-driven)
│   ├── dashboard/            # Analytics + AI insights
│   ├── leaderboard/          # Hero Points & badges
│   ├── admin/                # Officer panel
│   └── api/
│       ├── analyze/          # Vision Agent endpoint
│       ├── chat/             # Civic Assistant endpoint
│       └── insights/         # Impact Analytics endpoint
├── agents/                   # Gemini agents (vision, duplicate, assistant, analytics)
├── components/
│   ├── ui/                   # ShadCN-style primitives (Button, Card, Badge…)
│   ├── auth/                 # AuthProvider + SignInModal
│   ├── layout/               # Navbar, Footer
│   ├── issues/               # IssueCard, Timeline
│   ├── report/               # MediaUpload
│   ├── map/                  # IssueMap
│   └── chat/                 # CivicAssistant widget
├── services/                 # Firestore data access (issues, users, comments…)
├── store/                    # Zustand stores (auth)
├── hooks/                    # useAuth, useGeolocation
├── lib/                      # firebase, utils, analytics
└── types/                    # Domain types
```

---

## 🧱 Data model (Firestore)

| Collection | Key fields |
|------------|-----------|
| `users` | name, email, avatar, **heroPoints**, role, reportsCount, resolvedCount, badges[] |
| `issues` | title, description, category, severity, status, lat/lng, address, imageUrl, verificationStatus, confirmCount, **timeline[]**, createdBy, assignedTo |
| `verifications` | issueId, userId, voteType (`confirm`/`upvote`/`reject`) |
| `comments` | issueId, userId, userName, message |
| `rewards` | userId, badge, points |

**Gamification:** report `+10`, verified report `+15`, verify `+5`, comment `+2`, resolved `+20`. Badges unlock by points/report/resolved thresholds (`services/gamification.ts`).

---

## ☁️ Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add all env vars from `.env.local` to the Vercel project.
3. Deploy. Add your Vercel domain to **Firebase Auth → Settings → Authorized domains** and restrict the Maps key to it.

```bash
npm run build && npm start     # or deploy via Vercel
```

---

## 🧰 Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand ·
Firebase (Auth / Firestore / Storage) · Google Maps · Google Gemini ·
Recharts · lucide-react.

> Note: this build uses **Firebase** (not Supabase/Prisma) per project choice, and the **blue glassmorphism** design system (`#2563EB` / Inter).
