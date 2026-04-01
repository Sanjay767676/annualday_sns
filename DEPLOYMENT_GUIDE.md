# Production Deployment Guide - Annual Day SNS

## ✅ Completed Tasks

### 1. Full Project Debugging ✓
- Scanned entire codebase and fixed all TypeScript errors
- **Fixed TS2305 (missing exports)**: Updated `lib/api-zod/src/index.ts` to remove `.js` extension causing resolution issues
- **Fixed TS7006 (implicit any types)**: All route handlers now have proper `Request` and `Response` types from Express
- **Zero TypeScript errors** across all workspace packages

### 2. Monorepo Structure Fix ✓
- Verified internal package imports: `@workspace/db`, `@workspace/api-zod`
- Confirmed proper barrel exports in all lib packages
- Fixed path resolution for ESM modules with explicit `.js` extensions where needed
- All workspace references now properly resolved

### 3. Prisma Integration Setup ✓
- Created Prisma schema at `lib/db/prisma/schema.prisma`
- Added Prisma Client singleton with connection pooling at `lib/db/src/prisma-client.ts`
- Updated database package to export both Drizzle (for backward compatibility) and Prisma
- Added necessary Prisma scripts to package.json

### 4. Route Handler Fixes ✓
- `artifacts/api-server/src/routes/health.ts` - Fixed request/response typing
- `artifacts/api-server/src/routes/faculty.ts` - Fixed handler signatures
- `artifacts/api-server/src/routes/student.ts` - Fixed handler signatures
- `artifacts/api-server/src/routes/admin.ts` - Fixed handler signatures

### 5. Vercel Deployment Configuration ✓
- Updated `vercel.json` to generate Prisma client during build
- Updated root `package.json` with postinstall script for Prisma generation
- Configured strict TypeScript compliance

### 6. Environment Setup ✓
- Created `.env.example` with required configuration
- Updated `.gitignore` to exclude environment files and sensitive data

---

## 🚀 Next Steps - Complete Setup

### Step 1: Get Your Supabase Connection String

1. Go to [supabase.com](https://supabase.com) and create/login to your project
2. Navigate to **Project Settings → Database → Connection String**
3. Copy the URI connection string (PostgreSQL format)
4. Keep this safe - you'll need it for Vercel

### Step 2: Install Dependencies Locally

```bash
pnpm install
```

This will automatically run the postinstall script to generate Prisma client.

### Step 3: Set Up Local Database Environment

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
ADMIN_PASSWORD=your-secure-password
NODE_ENV=development
BASE_PATH=/
```

**Example for Supabase:**
```env
DATABASE_URL=postgresql://postgres.abc123def456:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
ADMIN_PASSWORD=SecureAdminPassword123
NODE_ENV=development
BASE_PATH=/
```

### Step 4: Create Database Tables

Run Prisma migrations to create tables:

```bash
pnpm --filter @workspace/db run prisma:migrate
```

Or use Prisma Studio to manage schema visually:

```bash
pnpm --filter @workspace/db run prisma:studio
```

### Step 5: Build & Test Locally

```bash
# Run typecheck
pnpm run typecheck

# Build the project
pnpm run build

# Start development server (if configured)
pnpm --filter @workspace/api-server run dev
```

### Step 6: Deploy to Vercel

1. **Add Environment Variables to Vercel**
   - Go to your Vercel project settings
   - Navigate to **Settings → Environment Variables**
   - Add the following:
     - `DATABASE_URL`: Your **Supabase Pooler** URL (e.g., `postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=no-verify`)
     - `ADMIN_PASSWORD`: Your secure admin password
     - `NODE_ENV`: `production`
     - `BASE_PATH`: `/`

2. **Trigger Deployment**
   ```bash
   git push origin main
   ```
   Vercel will automatically:
   - Install dependencies
   - Generate Prisma client
   - Run TypeScript checks
   - Build the project
   - Deploy to edge functions

---

## 📦 Database Schema

### FacultySubmission
```prisma
- id: UUID (Primary Key)
- data: JSON (Faculty submission data - papers, books, patents, PhD info)
- createdAt: DateTime
```

### StudentSubmission
```prisma
- id: UUID (Primary Key)
- name: String (Optional)
- email: String (Optional)
- customField: String (Optional)
- data: JSON (Student submission data - rankings, achievements)
- createdAt: DateTime
```

---

## 🔄 API Endpoints

### Health Check
```
GET /api/healthz
→ { status: "ok" }
```

### Submit Faculty Data
```
POST /api/faculty
Body: {
  papersPublished: [...],
  booksChapters: [...],
  patentsGranted: [...],
  phdAwardees: [...]
}
→ { id: UUID, message: "Faculty form submitted successfully" }
```

### Submit Student Data
```
POST /api/student
Body: {
  firstRankHolders: [...],
  semesterWiseRankers: [...],
  remarkableAchievements: [...]
}
→ { id: UUID, message: "Student form submitted successfully" }
```

### Get Faculty Submissions (Admin)
```
GET /api/admin/faculty?type=paper&search=keyword&page=1&limit=10
Headers: x-admin-token: password
```

### Get Student Submissions (Admin)
```
GET /api/admin/student?type=firstRank&search=keyword&page=1&limit=10
Headers: x-admin-token: password
```

### Admin Login
```
POST /api/admin/login
Body: { password: "admin-password" }
→ { token: "...", message: "Login successful" }
```

### Get Stats
```
GET /api/admin/stats
Headers: x-admin-token: password
→ { totalFacultySubmissions, totalStudentSubmissions, recentFacultySubmissions, recentStudentSubmissions }
```

---

## 🛠️ Useful Commands

### Development
```bash
# Typecheck only
pnpm run typecheck

# Build
pnpm run build

# Generate Prisma types
pnpm --filter @workspace/db run prisma:generate

# Prisma Studio (visual database manager)
pnpm --filter @workspace/db run prisma:studio
```

### Database Management
```bash
# Create new migration
pnpm --filter @workspace/db exec prisma migrate dev --name [migration_name]

# Reset database (⚠️ destructive)
pnpm --filter @workspace/db exec prisma migrate reset

# Validate schema syntax
pnpm --filter @workspace/db exec prisma validate
```

### Deployment
```bash
# Deploy to Vercel
git push origin main

# Check Vercel build logs
# Go to vercel.com → Select project → Deployments
```

---

## ✨ Key Features

✅ **Zero TypeScript Errors** - Full strict mode compliance
✅ **Prisma ORM** - Modern, type-safe database access
✅ **Supabase Compatible** - Works with Supabase PostgreSQL
✅ **Serverless Ready** - Configured for Vercel edge functions
✅ **Proper Error Typing** - All handlers have correct Express types
✅ **Environment Isolated** - Configuration via environment variables
✅ **Production Ready** - Includes migrations and client generation

---

## 🐛 Troubleshooting

### "DATABASE_URL is required but not provided"
- Add `DATABASE_URL` environment variable
- For local dev: Create `.env.local` with your database URI
- For Vercel: Add in project settings → Environment Variables

### "Prisma client not generated"
```bash
pnpm --filter @workspace/db run prisma:generate
```

### "Migration failed"
```bash
# Check migration status
pnpm --filter @workspace/db exec prisma migrate status

# Resolve conflicts and retry
pnpm --filter @workspace/db run prisma:migrate
```

### TypeScript errors after changes
```bash
pnpm run typecheck
```

### Build fails on Vercel
1. Check environment variables are set
2. Verify DATABASE_URL format
3. Check Vercel build logs
4. Ensure Prisma migration has been run

---

## 📞 Support

For issues:
1. Check that DATABASE_URL is correct
2. Verify Supabase tables exist (run migrations)
3. Review Vercel build logs
4. Check environment variables are properly set

---

## 🎯 Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `lib/db/prisma/schema.prisma` | Created | Prisma schema definition |
| `lib/db/src/prisma-client.ts` | Created | Prisma singleton instance |
| `lib/db/package.json` | Updated | Added Prisma scripts & deps |
| `lib/api-zod/src/index.ts` | Fixed | Removed `.js` extension |
| `artifacts/api-server/src/routes/*.ts` | Fixed | Added proper Request/Response typing |
| `vercel.json` | Updated | Added Prisma generation to build |
| `package.json` | Updated | Added postinstall script |
| `.env.example` | Created | Environment documentation |
| `.gitignore` | Updated | Added .env and Prisma files |

---

Ready to deploy! Follow the steps above and you'll have a production-ready setup. 🚀
