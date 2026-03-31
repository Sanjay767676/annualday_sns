# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── forms-app/          # React + Vite dynamic form system
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: Dynamic Form System

### Features
- **Home Page**: Entry point with Student / Faculty / Admin buttons
- **Faculty Form** (`/faculty`): 6 dynamic sections with "Add More" functionality
  - Papers Published, Books/Chapters, Patents Granted, Semester Toppers, Remarkable Achievements, PhD Awardees
  - Collection period: May 2025 – March 2026
- **Student Form** (`/student`): 3-field form with validation
- **Admin Login** (`/admin/login`): Password-protected access
- **Admin Dashboard** (`/admin`): View all submissions with stats

### Admin Access
- Default password: `admin123`
- Can be overridden via `ADMIN_PASSWORD` environment variable

### API Endpoints
- `POST /api/faculty` — Submit faculty form
- `POST /api/student` — Submit student form
- `POST /api/admin/login` — Admin authentication
- `GET /api/admin/faculty` — All faculty submissions (requires x-admin-token)
- `GET /api/admin/student` — All student submissions (requires x-admin-token)
- `GET /api/admin/stats` — Submission statistics (requires x-admin-token)

### Database Tables
- `faculty_submissions`: id (uuid), data (jsonb), created_at
- `student_submissions`: id (uuid), name, email, custom_field, created_at

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — cross-package imports require `references` array in tsconfig.json

## Key Commands

- `pnpm run build` — full build
- `pnpm run typecheck` — typecheck all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client/zod from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
