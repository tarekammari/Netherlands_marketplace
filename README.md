# TaskBridge NL — Netherlands Student-Enterprise Task Marketplace

A production-grade, two-sided marketplace platform connecting Dutch university students with enterprises for short-term professional tasks.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (JWT + OAuth) |
| Payments | Stripe Connect Express (Escrow) |
| Email | Resend |
| Storage | Cloudflare R2 (S3-compatible) |
| PDF | pdf-lib |
| Rate Limiting | Upstash Redis |
| Styling | Tailwind CSS |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in all required values (see .env.example for documentation)
```

### 3. Set up the database

```bash
# Push schema to your PostgreSQL instance
npm run db:push

# Run custom SQL migrations (full-text search indexes)
psql $DATABASE_URL < prisma/migrations/0001_search_and_indexes.sql

# Seed development data (optional)
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
# Visit http://localhost:3000
```

### 5. Set up Stripe webhook (local)

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhooks
```

---

## Project Structure

```
src/
├── app/
│   ├── api/                    # All API route handlers
│   │   ├── auth/               # NextAuth + register + verify
│   │   ├── tasks/              # Task CRUD + listing
│   │   ├── applications/       # Apply + select student
│   │   ├── milestones/         # Approve milestones
│   │   ├── stripe/             # Escrow + Connect + Webhooks
│   │   ├── messages/           # Encrypted messaging
│   │   ├── reviews/            # Bidirectional reviews
│   │   ├── notifications/      # In-app notifications
│   │   ├── admin/              # Admin user management
│   │   └── health/             # Health check
│   ├── tasks/                  # Public SSR task pages
│   ├── login/                  # Auth pages
│   ├── register/               # Registration flow
│   ├── student/                # Student dashboard
│   ├── enterprise/             # Enterprise dashboard
│   └── admin/                  # Admin panel
├── components/
│   ├── ui/                     # Design system: Button, Card, Badge, Input
│   ├── layout/                 # Navbar, UserMenu, Footer
│   ├── tasks/                  # TaskCard, TaskFilters
│   └── auth/                   # LoginForm, RegisterForm
├── lib/
│   ├── env.ts                  # Validated env variables
│   ├── db.ts                   # Prisma singleton
│   ├── auth.ts                 # NextAuth config
│   ├── stripe.ts               # Stripe client + helpers
│   ├── crypto.ts               # AES-256-GCM field encryption
│   ├── rate-limit.ts           # Rate limiting
│   ├── guards.ts               # API route guards
│   ├── api-response.ts         # Standardised responses
│   ├── email.ts                # Email templates
│   ├── logger.ts               # Structured logging
│   ├── storage.ts              # R2/S3 file storage
│   ├── utils.ts                # Shared utilities
│   ├── pdf/                    # Contract PDF generator
│   └── validations/            # Zod schemas
├── middleware.ts               # Edge auth + role guards
prisma/
├── schema.prisma               # Full database schema
├── migrations/                 # SQL migrations
└── seed.ts                     # Development seeder
```

---

## Security Architecture

| Layer | Mechanism |
|---|---|
| Transport | HTTPS enforced (HSTS 2yr) |
| Auth | JWT (15min) + refresh rotation |
| Passwords | bcrypt cost=12 |
| CSRF | SameSite=Strict cookies |
| Rate Limiting | Upstash Redis sliding window |
| SQL Injection | Prisma parameterised queries |
| XSS | CSP headers + input sanitisation |
| Data at rest | AES-256-GCM field-level encryption |
| Messages | AES-256-GCM encrypted in DB |
| File access | Private R2 + pre-signed URLs |
| Payments | Stripe PCI DSS, webhook sig verification |
| Route guards | Edge middleware + API guards |
| Audit | Immutable AuditLog table |

---

## Payment Flow

```
Enterprise creates task
       ↓
Student applies → Enterprise selects
       ↓
Contract PDF generated → Both parties sign
       ↓
Enterprise funds escrow (Stripe PaymentIntent, capture_method=manual)
       ↓
Student works → Submits milestones
       ↓
Enterprise approves each milestone
       ↓
All milestones approved → Escrow captured
       ↓
Stripe webhook → Transfer to student Connect account
       ↓
Platform keeps 10% application_fee_amount
```

---

## Test Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskbridge.nl | Admin@1234! |
| Enterprise | enterprise@acmecorp.nl | Test@1234! |
| Student | student@tue.nl | Test@1234! |

---

## Extensibility

The codebase is designed for easy extension:

- **New task categories**: Add to `TaskCategory` enum in `schema.prisma` + `CATEGORY_LABELS` in `utils.ts`
- **New email templates**: Add a function in `lib/email.ts`
- **New API endpoint**: Create a route handler using the existing guard/response utilities
- **New UI components**: Add to `components/ui/` following the existing CVA pattern
- **New user roles**: Add to `UserRole` enum + update middleware `PROTECTED_ROUTES`
- **Custom fields**: Add to Prisma schema + validation schemas

---

## Deployment

### Vercel (recommended)

```bash
vercel deploy
# Set all .env.example variables in Vercel dashboard
```

### Docker

```bash
docker build -t taskbridge-nl .
docker run -p 3000:3000 --env-file .env.local taskbridge-nl
```
