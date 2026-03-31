# Zniche — Skill-to-Income Marketplace

## Overview

Zniche (zee-niche) is an AI-powered skill-to-income marketplace. Users describe their skill, watch AI build their micro-product live in 6 animated steps, and get a marketplace listing with Stripe checkout in 20 minutes.

**Tagline:** "Turn what you know into what you earn."

## Brand

- Primary: `#6339FF` (Deep Violet)
- Accent: `#00F5A0` (Neon Mint)
- Alert: `#FF4D6D` (Signal Red)
- Dark background: `#08080F` (Abyss)
- Light background: `#F0EDFF` (Ghost Haze)
- Font: Inter (weight 700 headings, -0.04em tracking)
- Dark-first UI (default theme is dark)

## Design System

- **Dark-first**: Default theme is dark (#08080F background)
- **Glass navbar**: `backdrop-filter: blur(16px)` with semi-transparent bg
- **Pill buttons**: `border-radius: 999px` for CTAs
- **Focus rings**: Expanding `#6339FF` glow on focus
- **No spinners**: Shimmer loading animations in primary/10%
- **Vertical timeline**: Build feed uses left-side vertical timeline
- **Masonry layout**: Marketplace uses CSS columns masonry (2/3/4 responsive)
- **Micro-animations**: 250ms ease-out transitions on state changes

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

- `/` — Dark hero with typewriter skill cycling, live build feed mini-preview, 3-step explainer
- `/build` — Conversational UI (textarea + sliders) → vertical timeline build feed (left timeline + right streaming panel) → celebration screen
- `/marketplace` — Masonry layout, category filter pills, stat cards, search
- `/product/:id` — Full sales page (no navbar/footer for conversion focus)
- `/dashboard` — Creator dashboard with products (auth required)
- `/admin` — Admin panel (password: "zniche-admin")

## Database Schema

### `users` table (from Replit Auth)
- id, email, firstName, lastName, profileImageUrl, createdAt, updatedAt

### `products` table
- id, userId, skill, hoursPerWeek, price, status
- productName, productDescription, productFormat, category
- headline, salesCopy, socialCaptions, stripeCheckoutUrl
- marketplaceListed, creatorFirstName, marketResearch
- createdAt, updatedAt

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
- `POST /api/ai/build` — SSE streaming AI build (6 steps)

## AI Build Feed (6 Steps)

1. Scanning market demand (Claude with web search)
2. Designing your product (Claude product concept)
3. Writing your sales page (Claude copywriting)
4. Finding your cover image (visual selection)
5. Creating your checkout (Stripe session)
6. Publishing to marketplace (DB save + listing)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — Express session secret
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic AI proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic AI key (auto-provisioned)
- `STRIPE_SECRET_KEY` — Stripe secret key (optional, for live payments)
