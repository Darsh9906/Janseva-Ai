# 🇮🇳 JanSeva-AI — Hyperlocal Civic Problem Solver

> **Report. Track. Resolve.**

JanSeva-AI is an AI-powered civic issue management platform designed to connect citizens, government administrators, and field officers through a transparent and structured issue-resolution workflow.

Citizens can report local civic problems such as potholes, water leaks, broken streetlights, garbage, and other infrastructure issues. AI-assisted analysis helps classify and prioritize reports, while administrators can verify and assign issues to authorized officers. Officers can then manage assigned work and update the issue lifecycle until resolution.
   
The platform combines **AI, geolocation, community participation, role-based access control, analytics, and civic workflow management** into one unified system.

---

## ✨ Key Features

| #  | Feature                        | Description                                                                                                   |
| -- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1  | 🤖 **AI Issue Analysis**       | Gemini Vision analyzes uploaded images/videos to identify issue category, severity, department and confidence |
| 2  | 📍 **Interactive Map**         | Displays civic issues using location-based markers and severity information                                   |
| 3  | 👥 **Community Validation**    | Citizens can confirm, support/upvote and flag reported issues                                                 |
| 4  | 📋 **Issue Timeline**          | Tracks an issue from reporting through verification, assignment, progress and resolution                      |
| 5  | 🏆 **Citizen Gamification**    | Hero Points, badges and citizen leaderboard encourage meaningful civic participation                          |
| 6  | 💬 **AI Civic Assistant**      | Gemini-powered assistant answers civic questions using available issue data                                   |
| 7  | 🔎 **Duplicate Detection**     | Detects potentially duplicate nearby reports before submission                                                |
| 8  | 📊 **Impact Analytics**        | Provides issue statistics, trends, hotspots and AI-generated civic insights                                   |
| 9  | 🛡️ **Role-Based Access**      | Separate Citizen, Officer and Admin access with protected dashboards                                          |
| 10 | 👨‍💼 **Admin Management**     | Administrators review issues and assign work to authorized officers                                           |
| 11 | 👷 **Officer Workflow**        | Officers view assigned issues and update progress and resolution status                                       |
| 12 | 🔐 **Firebase Authentication** | Secure authentication with role-aware access control                                                          |

---

# 👤 User Roles

JanSeva-AI follows a three-role access model.

```text
                         JANSEVA-AI
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
          CITIZEN           OFFICER          ADMIN
             │                │                │
             ▼                ▼                ▼
       Report Issues      Assigned Issues   Manage Issues
       Track Reports      Update Status     Assign Officers
       Validate Issues   Resolve Issues    Verify Issues
       Earn Points       View Workload     Analytics
       Leaderboard                       Management
```

## 🧑 Citizen

Citizens are the primary public users of JanSeva-AI.

### Citizen capabilities

* Create a citizen account
* Sign in
* Report civic issues
* Upload images/videos
* Use AI-powered issue analysis
* Provide issue location
* View reported issues
* Track issue progress
* Confirm/support reported issues
* Comment where permitted
* View issue timelines
* Earn Hero Points
* Unlock badges
* Participate in the public citizen leaderboard
* Use the AI Civic Assistant

### Citizen registration

Public registration creates a **Citizen** account only.

A citizen cannot select or assign themselves:

```text
admin
officer
```

during registration.

---

# 👷 Officer

Officers are authorized staff members responsible for handling issues assigned to them.

Officer accounts are **not publicly registered**.

### Officer capabilities

* Secure staff login
* Access Officer Dashboard
* View assigned civic issues
* Review issue information
* View location and uploaded evidence
* Check issue priority and category
* Update work status
* Mark assigned issues as resolved
* Track assigned workload

Officers cannot:

* Promote themselves to Admin
* Change their own role
* Create Admin accounts
* Access Admin-only controls
* Modify unrelated users
* Arbitrarily assign issues unless authorized by the system

---

# 🛡️ Admin

Administrators manage the civic issue-resolution workflow.

Admin accounts are **privileged accounts provisioned by the system**, not public registrations.

### Admin capabilities

* Access Admin Dashboard
* View reported issues
* Review issue information
* Verify reported issues
* Review AI-generated classification
* Assign issues to authorized officers
* Reassign issues when required
* Monitor issue status
* View officer workload
* Monitor issue statistics
* View analytics
* Review civic impact
* Manage the operational workflow

---

# 🔐 Role-Based Authentication

JanSeva-AI separates authentication from authorization.

The login interface allows the user to select the intended access type:

```text
              Sign In
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
    Citizen    Officer    Admin
       │         │         │
       ▼         ▼         ▼
   Citizen DB  Staff DB  Admin DB
       │         │         │
       ▼         ▼         ▼
   Citizen     Officer    Admin
   Dashboard   Dashboard  Dashboard
```

### Important security principle

Selecting **Admin** or **Officer** in the login interface does not grant that role.

The application verifies the authenticated account's actual authorized role before allowing access.

For example:

```text
Citizen account
       │
       ├── Citizen login → ✅ Allowed
       │
       ├── Officer login → ❌ Denied
       │
       └── Admin login → ❌ Denied
```

This prevents ordinary users from gaining privileged access simply by selecting a different role.

---

# 🏛️ Civic Issue Workflow

JanSeva-AI follows a structured issue lifecycle.

```text
Citizen Reports Issue
          │
          ▼
    AI Analysis
          │
          ▼
       Reported
          │
          ▼
       Verified
          │
          ▼
  Admin Assigns Officer
          │
          ▼
       Assigned
          │
          ▼
      In Progress
          │
          ▼
       Resolved
```

### Example

A citizen notices a large pothole.

```text
1. Citizen uploads pothole image
              ↓
2. AI analyzes the image
              ↓
3. Category/severity are generated
              ↓
4. Duplicate reports are checked
              ↓
5. Citizen submits the report
              ↓
6. Admin reviews the issue
              ↓
7. Admin assigns an authorized officer
              ↓
8. Officer starts working
              ↓
9. Officer updates progress
              ↓
10. Officer marks issue resolved
              ↓
11. Citizen can track the resolution
```

---

# 🤖 Agentic AI Architecture

JanSeva-AI uses Google Gemini-powered agents for multiple civic workflows.

## 1. Vision Agent

Location:

```text
src/agents/civicInspector.ts
```

Responsibilities:

* Analyze uploaded images/videos
* Identify civic issue type
* Estimate severity
* Suggest responsible department
* Generate confidence information
* Produce structured issue information

---

## 2. Duplicate Detection Agent

Location:

```text
src/agents/duplicateDetector.ts
```

Responsibilities:

* Compare a new report with nearby existing reports
* Consider location and issue category
* Identify potentially duplicate reports
* Help prevent repeated submissions

---

## 3. Civic Assistant

Location:

```text
src/agents/civicAssistant.ts
```

Responsibilities:

* Answer citizen questions
* Provide civic issue information
* Interact with available issue data
* Assist users through natural-language queries

---

## 4. Impact Analytics Agent

Location:

```text
src/agents/impactAnalytics.ts
```

Responsibilities:

* Analyze civic issue data
* Identify patterns and trends
* Generate useful civic insights
* Support dashboard analytics

---

## 5. Gemini Service

Location:

```text
src/services/gemini.ts
```

Provides a centralized Gemini integration with:

* Model handling
* Retry mechanisms
* Fallback model support
* Error handling
* AI service abstraction

---

# 🗺️ Interactive Map

The JanSeva-AI map displays civic issues geographically.

The map can provide:

* Issue locations
* Severity information
* Issue categories
* Issue details
* Interactive markers
* Location-based civic information

The map is driven by application issue data rather than static demo data.

---

# 👥 Community Validation

Citizens can participate in validating civic reports.

Supported actions may include:

* Confirm
* Upvote/support
* Reject/flag
* Comment

Community activity helps improve the reliability and visibility of civic reports.

---

# 🏆 Citizen Gamification

JanSeva-AI encourages meaningful civic participation through Hero Points and badges.

Example point structure:

| Activity        | Points |
| --------------- | -----: |
| Report issue    |    +10 |
| Verified report |    +15 |
| Verify issue    |     +5 |
| Comment         |     +2 |
| Resolved report |    +20 |

Badges can be unlocked according to configured contribution thresholds.

Examples include:

* 🏅 Top Reporter
* 🔧 Problem Solver
* Other achievement-based badges

---

# 🥇 Citizen Leaderboard

The public leaderboard is designed to represent **citizen participation**.

Only eligible Citizen accounts should participate in the public leaderboard.

```text
Citizen
   │
   ├── Reports
   ├── Validations
   ├── Contributions
   └── Points
          │
          ▼
   Citizen Leaderboard
```

### Staff separation

Officer and Admin accounts should not be mixed into the public citizen leaderboard.

Staff performance can instead be monitored through internal administrative analytics such as:

* Issues assigned
* Issues resolved
* Pending workload
* Resolution performance
* Average resolution time

This keeps **citizen engagement metrics** separate from **staff operational metrics**.

---

# 📊 Dashboards

## Citizen Dashboard

The Citizen Dashboard focuses on personal civic participation.

Typical sections include:

* My Reports
* Active Issues
* Resolved Issues
* Issue Status
* Hero Points
* Badges
* Activity
* Leaderboard position

---

## Officer Dashboard

The Officer Dashboard focuses on assigned operational work.

Typical sections include:

* Assigned Issues
* Pending Issues
* In Progress
* Resolved Issues
* Issue Priority
* Locations
* Workload information
* Status update controls

---

## Admin Dashboard

The Admin Dashboard provides operational oversight.

Typical sections include:

* Total Issues
* Reported Issues
* Verified Issues
* Assigned Issues
* In Progress Issues
* Resolved Issues
* Officer Management
* Issue Assignment
* Analytics
* Civic Impact
* AI-generated Insights

---

# 🗃️ Firestore Data Model

The application uses Firebase Firestore for persistent application data.

## `users`

Stores user profiles and role information.

Example fields:

```text
name
email
avatar
heroPoints
role
reportsCount
resolvedCount
badges[]
createdAt
updatedAt
```

Supported roles:

```text
citizen
officer
admin
```

---

## `issues`

Stores civic issue reports.

Example fields:

```text
title
description
category
severity
status
lat
lng
address
imageUrl
verificationStatus
confirmCount
timeline[]
createdBy
assignedTo
createdAt
updatedAt
```

---

## `verifications`

Stores community validation actions.

```text
issueId
userId
voteType
```

Supported vote types may include:

```text
confirm
upvote
reject
```

---

## `comments`

Stores issue-related community comments.

```text
issueId
userId
userName
message
createdAt
```

---

## `rewards`

Stores gamification-related reward information.

```text
userId
badge
points
```

---

# 🧱 Project Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── report/
│   ├── issues/
│   │   └── [id]/
│   ├── map/
│   ├── dashboard/
│   ├── leaderboard/
│   ├── admin/
│   └── api/
│       ├── analyze/
│       ├── chat/
│       └── insights/
│
├── agents/
│   ├── civicInspector.ts
│   ├── duplicateDetector.ts
│   ├── civicAssistant.ts
│   └── impactAnalytics.ts
│
├── components/
│   ├── ui/
│   ├── auth/
│   ├── layout/
│   ├── issues/
│   ├── report/
│   ├── map/
│   └── chat/
│
├── services/
│   ├── issues
│   ├── users
│   ├── comments
│   ├── gamification
│   └── gemini
│
├── store/
│   └── auth/
│
├── hooks/
│   ├── useAuth
│   └── useGeolocation
│
├── lib/
│   ├── firebase
│   ├── utils
│   └── analytics
│
└── types/
```

---

# 🛠️ Technology Stack

### Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* Framer Motion
* Zustand
* Lucide React

### Backend / Platform

* Next.js App Router
* Firebase Authentication
* Firebase Firestore
* Firebase Storage

### AI

* Google Gemini
* Gemini Vision
* AI-powered civic analysis
* Duplicate detection
* Civic Assistant
* Impact Analytics

### Maps

* Google Maps

### Charts

* Recharts

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

A Firebase project is also required for full application functionality.

---

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd janseva-ai
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create:

```text
.env.local
```

Add the required configuration:

```env
GEMINI_API_KEY=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Do not commit `.env.local` to Git.

---

# 🔥 Firebase Configuration

Create a Firebase project and configure:

### Authentication

Enable the authentication provider required by the application.

Citizen registration should create normal Citizen accounts.

Officer and Admin accounts must be provisioned as authorized staff accounts rather than created through public registration.

### Firestore

Create a Firestore database and deploy the project's security rules and indexes.

### Storage

Enable Firebase Storage for issue media uploads.

The exact Firebase configuration should be kept in environment variables.

---

# 👨‍💼 Staff Account Provisioning

Officer and Admin accounts are privileged accounts.

They should not be created through the public Citizen signup process.

The user's verified role should be maintained securely:

```text
citizen
officer
admin
```

The application must verify the authenticated user's actual role before allowing privileged dashboard access.

> **Important:** Never expose staff credentials, API keys, passwords, or privileged setup information in the public README or application interface.

---

# ▶️ Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available locally at:

```text
http://localhost:3000
```

---

# 🔒 Security Principles

JanSeva-AI follows these core authorization principles:

### 1. Authentication ≠ Authorization

Logging in successfully does not automatically grant access to every part of the application.

### 2. Role selection is not role assignment

Selecting:

```text
Admin
```

on the login screen does not make an account an Admin.

The authenticated account's authorized role must be verified.

### 3. No public staff registration

Citizens cannot create Officer or Admin accounts through public signup.

### 4. Protected dashboards

Each dashboard is protected according to the user's authorized role.

### 5. Protected database access

Firestore rules should prevent unauthorized role changes and unauthorized access to protected data.

---

# 📡 API Routes

The application contains Next.js API endpoints for AI functionality.

| Endpoint        | Purpose                      |
| --------------- | ---------------------------- |
| `/api/analyze`  | AI vision analysis           |
| `/api/chat`     | Civic Assistant              |
| `/api/insights` | AI-generated impact insights |

The exact request and response structures are defined by the application's implementation.

---

# 📈 Issue Lifecycle

```text
┌─────────────┐
│   Reported  │
└──────┬──────┘
       ↓
┌─────────────┐
│   Verified  │
└──────┬──────┘
       ↓
┌─────────────┐
│   Assigned   │
└──────┬──────┘
       ↓
┌─────────────┐
│ In Progress │
└──────┬──────┘
       ↓
┌─────────────┐
│   Resolved  │
└─────────────┘
```

The exact status values used by the application should remain consistent across:

* Citizen dashboard
* Officer dashboard
* Admin dashboard
* Issue details
* Timeline
* Analytics

---

# 🌐 Deployment

JanSeva-AI can be deployed using Vercel.

### Production build

```bash
npm run build
```

### Start production server

```bash
npm start
```

When deploying:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Configure all required environment variables.
4. Deploy the application.
5. Add the deployed domain to Firebase Authentication authorized domains.
6. Configure Google Maps API restrictions for the production domain.
7. Verify Firebase security rules.
8. Test Citizen, Officer and Admin access separately.

---

# 🧭 Future Scope

Potential future improvements include:

* Government department integrations
* SMS/email notifications
* Push notifications
* Automated officer assignment
* Advanced geospatial analytics
* Multilingual civic assistant
* Regional-language support
* Public transparency reports
* Mobile application
* Real-time issue status notifications
* Advanced AI-based severity prediction
* Municipal API integration

# 👨‍💻 Development Philosophy

JanSeva-AI is designed around a simple civic workflow:

> **Citizens report problems → AI helps understand them → Admins coordinate them → Officers resolve them → Citizens track the impact.**

The goal is to create a transparent, accountable and technology-assisted approach to local civic issue management.

---

## 📄 License

This project was developed as an academic BCA Semester 5 Minor Project.

All project-specific source code, designs and academic materials are maintained by the project team.
