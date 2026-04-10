# Stadi Frontend

**Stadi — Learn Skills. Start Earning.**  
React 18 Progressive Web App for the Stadi vocational learning platform.

---

## Tech Stack

| Layer            | Technology                                    |
|------------------|-----------------------------------------------|
| Framework        | React 18 + Vite                               |
| Styling          | Tailwind CSS 3                                |
| Routing          | React Router v6                               |
| State            | Zustand (auth + app state)                    |
| Data fetching    | TanStack Query (React Query v5)               |
| HTTP client      | Axios                                         |
| Icons            | Lucide React                                  |
| Fonts            | DM Sans + Playfair Display (Google Fonts)     |
| AI Chat          | Claude API (claude-sonnet-4-20250514)         |
| Hosting          | Vercel (recommended)                          |

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ai/           # AI chat widget (Claude-powered)
│   │   ├── auth/         # AuthModal (OTP login/register)
│   │   ├── course/       # CourseCard, CourseGrid
│   │   ├── layout/       # Navbar, Footer, MobileBottomNav, OfflineBanner
│   │   └── ui/           # Button, Badge, Input, Skeleton, Modal, Toast, etc.
│   ├── pages/
│   │   ├── Home.jsx        # Kenya-first hero, earn proof, testimonials
│   │   ├── Courses.jsx     # Browse with search + filters
│   │   ├── CourseDetail.jsx# Full course detail, enrolment, income guide
│   │   ├── Dashboard.jsx   # Learner dashboard, streaks, referrals
│   │   ├── Learn.jsx       # Video player + lesson sidebar
│   │   ├── Profile.jsx     # Profile settings (language, county, name)
│   │   ├── Admin.jsx       # Admin dashboard
│   │   └── Instructor.jsx  # Instructor portal
│   ├── lib/
│   │   └── api.js          # Typed Axios API client with auto token refresh
│   ├── store/
│   │   ├── auth.store.js   # Zustand auth store (JWT, user, login state)
│   │   └── app.store.js    # Zustand app store (toasts, language, offline)
│   ├── App.jsx             # Router + SEO + lazy loading
│   ├── main.jsx            # React entry point
│   └── index.css           # Tailwind base + component classes
├── index.html              # HTML shell with SEO meta tags
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── package.json
```

---

## Design System

### Brand Colours
| Token                  | Hex       | Use                            |
|------------------------|-----------|--------------------------------|
| `stadi-green`          | `#1A6B4A` | Primary actions, headings      |
| `stadi-orange`         | `#F4A22C` | Earn badges, CTAs, accents     |
| `stadi-dark`           | `#2D2D2D` | Body text                      |
| `stadi-gray`           | `#555555` | Secondary text                 |
| `stadi-green-light`    | `#EAF4EE` | Backgrounds, hover states      |
| `stadi-orange-light`   | `#FEF3E0` | Callout boxes, highlights      |

### Typography
- **Display / Headings**: Playfair Display 700
- **Body / UI**: DM Sans 400 / 500 / 600 / 700

### Key UI Components (all in `src/components/ui/index.jsx`)
- `Button` — primary, secondary, outline, ghost, danger
- `Badge` — green, orange, gray, red, blue
- `Input` — with label, error, prefix support
- `Skeleton` + `SkeletonCard` — loading states on every data-dependent component
- `ProgressBar` — animated fill with optional label
- `Modal` — sm/md/lg/xl/full sizes
- `ToastContainer` — success/error/info toasts (top-right)
- `EmptyState` — emoji + message + CTA action
- `StarRating` — 5-star display with count

---

## Key Features

### 🇰🇪 Kenya-First Design
- Kenyan faces and contexts in UI copy and testimonials
- M-Pesa payment flow (no bank account required)
- 15 local language selector in Navbar and Profile settings
- County selector for 47 Kenyan counties in Profile
- KNQA / TVET / NITA / ODPC trust badges throughout

### 📱 Mobile-First
- Responsive grid: 1 col mobile → 4 col desktop
- Mobile bottom navigation bar (Dashboard, Explore, Saved, Learning, Profile)
- Touch-friendly tap targets (44px minimum)
- Offline banner when network is lost
- 360px viewport tested for budget Android phones

### 💰 Earn Proof (Skills-to-Income Positioning)
- Every course card shows income range badge: **"Earn KES 20K–40K/mo"**
- Course detail page: entry-level vs experienced earnings comparison
- Tools list with local KES prices
- "Start a Business with This Skill" business guide section

### 👥 Social Proof
- Graduate testimonials with before/after income stories
- "X students enrolled this week" urgency trigger on course cards
- Star ratings with review counts
- County-specific graduate stories (Kisumu, Kakamega, Siaya, Homa Bay)

### 🔒 Auth Security (NITA/TVET/KNQA aligned)
- OTP-only login — no passwords (higher security for low-tech users)
- Auto-shows security assurances: ODPC, Data Protection Act 2019
- Authority badges: KNQA, TVET, NITA, ODPC
- Auto-refreshes JWT tokens silently

### 🤖 AI Chat Widget
- Powered by Claude API (claude-sonnet-4-20250514)
- Kenyan context: counties, M-Pesa, Jua Kali economy
- Quick prompts for common questions
- Fully accessible, keyboard navigable

### ♿ Accessibility
- Semantic HTML throughout
- ARIA labels on interactive elements
- Focus rings on all interactive elements
- Colour contrast ratio ≥ 4.5:1 throughout

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Set VITE_API_URL to your backend URL
# Set VITE_ANTHROPIC_API_KEY for the AI chat widget
```

### 3. Start development server
```bash
npm run dev
# → http://localhost:5173
```

### 4. Build for production
```bash
npm run build
# Output: dist/
```

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL=https://api.stadi.ke/api
# VITE_ANTHROPIC_API_KEY=your_key
```

Add a `vercel.json` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## SEO

- `<title>` updated per-page via `useSEO()` hook
- `<meta name="description">` updated per-page
- JSON-LD structured data (`EducationalOrganization`) in `App.jsx`
- `<meta name="theme-color" content="#1A6B4A">` for Android browser theming
- Semantic HTML: `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`

---

## Contact

**Felix Sawo** — Founder & CEO  
📧 felix@stadi.ke  
🌐 stadi.ke  
📍 Kisumu City, Western Kenya
