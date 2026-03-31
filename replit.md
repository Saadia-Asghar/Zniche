# Zniche — Skill-to-Income Marketplace

## Overview

Zniche (zee-niche) is an AI-powered skill-to-income marketplace. Users describe their skill, watch AI build their micro-product live in 7 animated steps, and get a marketplace listing with Stripe checkout in 20 minutes.

**Tagline:** "Your skill. Your product. Your income. — in 20 minutes."

## Brand

- Primary: #7C5CFC (Spark Purple)
- Accent: #23F0C7 (Mint Drop)
- Dark background: #0D0D0D
- Light background: #F5F2FF
- Font: Inter

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

- `/` — Landing page with hero, how-it-works, marketplace preview
- `/build` — 3-question form + Live AI Build Feed (7 animated steps)
- `/marketplace` — Public marketplace of all products
- `/product/:id` — Individual shareable product/sales page
- `/dashboard` — User's created products (auth required)
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
- `POST /api/ai/build` — SSE streaming AI build (7 steps)

## AI Build Feed

The 7-step AI build uses Anthropic Claude via SSE streaming:
1. Market research for user's skill
2. Micro-product concept generation
3. Sales copy and pricing
4. Sales page creation
5. Payment setup
6. 5 social media captions
7. Marketplace listing

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET` — Express session secret
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic AI proxy URL (auto-provisioned)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic AI key (auto-provisioned)
- `STRIPE_SECRET_KEY` — Stripe secret key (optional, for live payments)
