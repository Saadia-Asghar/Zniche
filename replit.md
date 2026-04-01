# Zniche — Skill-to-Income Marketplace

## Overview

Zniche (zee-niche) is an AI-powered skill-to-income marketplace. Users go through a conversational 5-screen onboarding (role → skill → audience → experience → format+price), pass an in-feed skill verification quiz at step 4, watch AI build their micro-product live in 8 animated steps, and get a marketplace listing with Stripe checkout in 20 minutes.

**Tagline:** "Turn what you know into what you earn."

## V3/V4 Features Added
- **Conversational Onboarding**: 5 screen tap-card flow (no forms) with slide transitions and progress dots
- **8-Step AI Build Feed**: Phase 1 (Steps 1-3 via SSE) → Step 4 (Skill Verification Quiz inline) → Phase 2 (Steps 5-8 via SSE)
- **Location Intelligence**: ipapi.co detection (24h cache) → Frankfurter currency conversion → PPP pricing (PPP_FACTORS for 30+ countries)
- **Enhanced Product Page**: Location-aware pricing display, live viewer count, coupon code field, waitlist mode support
- **Enhanced Dashboard**: Tab system (Overview, Products, AI Coach, Audience, Referrals, Settings), World Map (buyer countries as flags), Coupon Manager per product, AI Coach chat (Claude-powered), Referral system
- **Enhanced Marketplace**: Country filter pills, leaderboard, "Most Viewed" sort, "0 products found" count
- **New DB Tables**: waitlist, coupons, referrals, buyer_emails, bundles, page_views + new columns on products
- **New API Routes**: /api/suggest-skills, /api/suggest-audiences, /api/recommend-format, /api/currency/:from/:to, /api/leaderboard, /api/marketplace/countries, /api/analytics/world-map, /api/page-view, /api/coupons/*, /api/waitlist/*, /api/referral/*, /api/audience/*, /api/ai/build/phase1, /api/ai/build/phase2

## Brand

- Primary: `#5B2EFF` (Deep Violet)
- Accent: `#00F0A0` (Neon Mint)
- Alert: `#FF5A70` (Signal Red)
- Dark background: `#08080F` (Abyss)
- Light background: `#F0EDFF` (Ghost Haze)
- Font: Inter (weight 700 headings, -0.04em tracking)
- Dark-first UI (default theme is dark)

## Design System

- **Dark-first**: Default theme is dark (#08080F background)
- **Glass navbar**: `backdrop-filter: blur(16px)` with semi-transparent bg
- **Pill buttons**: `border-radius: 999px` for CTAs
- **Focus rings**: Expanding `#5B2EFF` glow on focus
- **No spinners**: Shimmer loading animations in primary/10%
- **Vertical timeline**: Build feed uses left-side vertical timeline
- **Masonry layout**: Marketplace uses CSS columns masonry (2/3/4 responsive)
- **Micro-animations**: 250ms ease-out transitions on state changes
- **3D Product Covers**: Pure CSS 3D transforms (perspective, rotateY, backface-hidden) with category-colored gradients and shine sweep — no WebGL/Three.js
- **Glass-morphism**: `glass-card` class with backdrop-filter blur + translucent borders for cards throughout
- **Floating shapes**: CSS animated decorative shapes in hero (animate-float, animate-float-alt keyframes)
- **Animated counters**: Stats bar with counting-up numbers on scroll (useInView trigger)
- **Testimonials**: Creator testimonials section with star ratings on homepage
- **Grid/List toggle**: Marketplace supports grid and list view modes
- **FAQ accordion**: Product page includes collapsible FAQ section
- **Trust badges**: Product page shows money-back guarantee, secure payment, verified creator badges
- **Circular progress ring**: Build page shows SVG ring with percentage during build
- **Parallax hero**: Product page hero has scroll-based parallax background elements
- **Multi-column footer**: 4-column footer layout (brand, product, account, more)
- **Animated mobile menu**: Framer Motion slide-down mobile nav instead of dropdown
- **Custom scrollbar**: Styled scrollbar matching dark theme
- **Confetti**: canvas-confetti on verification pass and build completion
- **Step particle burst**: Small confetti burst on each build step completion (not just final)
- **Route transitions**: Framer Motion AnimatePresence page transition animations between routes
- **Breadcrumb navigation**: Home icon + chevron trail on marketplace, dashboard, product pages
- **Notification bell**: Bell icon with green dot indicator in navbar (when logged in)
- **Creator gradient-ring avatar**: Gradient border ring on creator avatar (product page) + "Verified Creator" badge
- **Dashboard mini charts**: Animated bar charts in stat cards, AnimatedCounter for numbers
- **Featured cards**: Marketplace cards with accent ring + Featured banner for isFeatured products
- **ErrorBoundary**: All ProductCover3D instances wrapped in ErrorBoundary for graceful fallback

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: Replit Auth (OpenID Connect with PKCE)
- **AI**: Anthropic Claude (via Replit AI Integrations)
- **Payments**: Stripe Checkout
- **Animations**: Framer Motion
- **Theme**: next-themes (dark/light toggle)
- **3D Covers**: Pure CSS 3D transforms (no WebGL dependency)
- **Confetti**: canvas-confetti

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── zniche/             # React + Vite frontend (root path /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-anthropic-ai/  # Anthropic AI client
│   └── replit-auth-web/    # Replit Auth browser hook
└── scripts/                # Utility scripts
```

## Pages

- `/` — Dark hero with gradient "earn" text, typewriter skill cycling, floating CSS shapes, live build feed glass card, 3-step explainer, animated stats counter bar, testimonials section, CTA bottom section
- `/build` — Conversational UI (textarea + sliders) → skill verification quiz modal → vertical timeline build feed with circular SVG progress ring (7 steps, left timeline + right streaming panel) → celebration screen with confetti, CSS 3D cover, social sharing
- `/marketplace` — Glass-morphism cards with grid/list toggle, CSS 3D product covers, category filter pills, stat cards, search, sort
- `/product/:id` — Parallax hero, glass-card content area, CSS 3D cover, trust badges, FAQ accordion, reviews section, shine-effect Buy Now button (no navbar/footer for conversion focus)
- `/dashboard` — Creator dashboard with animated stat counters, mini bar charts, glass-card product list (auth required)
- `/admin` — Admin panel (password: "zniche-admin")

## Database Schema

### `users` table (from Replit Auth)
- id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt

### `products` table
- id, userId, skill, hoursPerWeek, price, status
- productName, tagline, productDescription, productFormat, category
- headline, salesCopy, socialCaptions, stripeCheckoutUrl, stripeProductId
- marketplaceListed, creatorFirstName, marketResearch
- pageSlug, viewCount, totalSales, totalRevenue
- isFeatured, isVerifiedCreator
- createdAt, updatedAt

### `reviews` table
- id, productId, buyerEmail (masked in API responses), rating (1-5), reviewText
- isVerifiedPurchase, createdAt

## API Routes

- `GET /api/healthz` — Health check
- `GET /api/auth/user` — Current auth user
- `GET /api/login` — OIDC login redirect
- `GET /api/callback` — OIDC callback
- `GET /api/logout` — OIDC logout
- `GET /api/products` — User's products (auth required)
- `POST /api/products` — Create product (auth required)
- `GET /api/products/:id` — Get product
- `PATCH /api/products/:id` — Update product (auth required)
- `DELETE /api/products/:id` — Delete product (auth required)
- `GET /api/marketplace` — Public marketplace listings
- `GET /api/marketplace/stats` — Marketplace stats
- `POST /api/stripe/create-checkout` — Create Stripe checkout session
- `POST /api/ai/build` — SSE streaming AI build (7 steps)
- `POST /api/ai/verify-skill` — Generate skill verification quiz (3 questions)
- `GET /api/reviews/:productId` — Get reviews (emails masked)
- `POST /api/reviews/:productId` — Submit a review

## AI Build Feed (7 Steps)

1. Scanning market demand (Claude market research)
2. Designing your product (Claude product concept)
3. Writing your sales page (Claude copywriting)
4. Building your sales page (page assembly)
5. Creating your checkout (Stripe session)
6. Writing social captions (Claude social copy)
7. Publishing to marketplace (DB save + listing)

## Skill Verification Quiz

- Triggered after build form submit, before the build starts
- Claude generates 3 multiple-choice questions specific to the user's stated skill
- Score ≥ 2/3 = pass (confetti + auto-start build)
- Score < 2/3 = fail (retry or edit skill options)
- Client-side gating (quiz is for trust signals, not hard security)

## Social Sharing (Build Celebration)

- Twitter/X, WhatsApp, LinkedIn deep link buttons
- Pre-written social captions from the build (copyable)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — Express session secret
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic AI proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic AI key (auto-provisioned)
- `STRIPE_SECRET_KEY` — Stripe secret key (optional, for live payments)
