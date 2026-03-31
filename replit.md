# Annual Day 2026 – Data Collection Portal
## SNS College of Technology, Coimbatore – 641 107

## Overview

Full-stack pnpm workspace monorepo. React + Vite frontend, Express 5 API, PostgreSQL database.
Portal collects Faculty and Student achievement data for Annual Day 2026 (May 2025 – March 2026).

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
- **Cross-env**: `cross-env` for NODE_ENV in dev scripts
- **Deployment**: Vercel (`vercel.json` at root)

## Structure

```text
artifacts-monorepo/
├── api/                    # Vercel serverless function entry point
│   └── index.ts            # Re-exports Express app for Vercel
├── artifacts/
│   ├── api-server/         # Express 5 API server (port from $PORT)
│   └── forms-app/          # React + Vite frontend (port from $PORT)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection
├── vercel.json             # Vercel deployment config
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Application: Annual Day 2026 Data Collection Portal

### Branding
- **Color scheme**: Deep navy (`#050d1a` / `#0c1f3d`), primary blue (`#1e40af`), gold (`#f59e0b` / `#fbbf24`)
- **Typography**: Bold/extrabold, clean uppercase labels, gradient text accents
- All pages show SNS College of Technology branding + "Annual Day 2026" chip

### Routes
| Route | Description |
|-------|-------------|
| `/` | Home – SNS branded landing with Student & Faculty cards |
| `/faculty` | Faculty form (4 sections, dynamic field arrays) |
| `/student` | Student form (3 sections, dynamic field arrays) |
| `/admin/login` | Admin sign-in (split-panel: dark brand + white form) |
| `/admin` | Admin dashboard (filter, search, paginate, Excel export) |

### Faculty Form – 4 Sections
1. **Papers Published** – faculty name, designation, title, journal type (Scopus/SCI/WOS/Annexure-1), month/year
2. **Book / Book Chapter** – name, designation, title, publisher & ISBN, month/year
3. **Patent Granted** – name, designation, title, design/product, month/year
4. **PhD Awardees** – name, designation, branch, university, year, thesis title

### Student Form – 3 Sections
1. **First Rank Holders** (upto Nov/Dec 2025) – name, dept, year, UG/PG, reg#, % secured
2. **Semester Wise First Rank** (class wise) – name, dept, year, UG/PG, % secured
3. **Remarkable Achievements** – name, dept, year, achievement details

### Admin Dashboard
- Password-protected (`ADMIN_PASSWORD` env var, default `admin123`)
- Token stored in `localStorage` as `admin_token`, sent as `x-admin-token` header
- Filter by form type (faculty / student) and section
- 400ms debounced search across all text fields
- Pagination: 10 rows per page
- Excel export via SheetJS (`xlsx`)
- 30s auto-refresh via React Query
- Stats cards: total faculty, student, overall submissions

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/faculty` | Submit faculty form |
| POST | `/api/student` | Submit student form |
| POST | `/api/admin/login` | Admin login → token |
| GET | `/api/admin/stats` | Dashboard stats (auth) |
| GET | `/api/admin/submissions` | Paginated submissions (auth) |

### Admin Submissions Query Params
- `type`: `faculty` | `student`
- `section`: section key (e.g. `papersPublished`, `firstRankHolders`)
- `search`: ILIKE text search (runs over jsonb section array via PostgreSQL)
- `page`: page number (default 1)
- `limit`: rows per page (default 10)

## Backend Notes

- `db.execute()` returns `{ rows: T[] }` in drizzle-orm pg – always access via `.rows`
- JSON path operator: `data->'sectionKey'` with quoted key string
- Faculty section map: `paper→papersPublished`, `book→booksChapters`, `patent→patentsGranted`, `phd→phdAwardees`
- Student section map: `firstRank→firstRankHolders`, `semesterWise→semesterWiseRankers`, `achievement→remarkableAchievements`
- Do NOT import from `zod/v4` directly in `api-server/src/routes/` — use `@workspace/api-zod`
- Always run `pnpm --filter @workspace/api-server run build` then restart `API Server` workflow after backend changes

## Vercel Deployment

- `vercel.json` at root handles: installCommand, buildCommand, outputDirectory, rewrites
- `/api/*` → serverless function (`api/index.ts`) → Express app
- `/*` → SPA fallback to `index.html`
- Required env vars in Vercel dashboard: `DATABASE_URL`, `ADMIN_PASSWORD`

## Development

```bash
# Start all services
pnpm run dev          # from root (if configured)

# Or start individually:
# API server
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/forms-app run dev

# After schema/route changes
pnpm --filter @workspace/api-spec run codegen      # regenerate API client
pnpm --filter @workspace/api-server run build      # rebuild API
```
