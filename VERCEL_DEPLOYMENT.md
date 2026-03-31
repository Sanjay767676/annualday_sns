# Vercel Deployment Guide - Prisma Setup

This guide explains how to properly deploy the Annual Day SNS application to Vercel with Prisma database migrations.

## 📋 Prerequisites

1. ✅ Supabase PostgreSQL project created
2. ✅ Connection string obtained
3. ✅ Vercel project linked to GitHub
4. ✅ All code changes committed and pushed

## 🔧 Step 1: Add Environment Variables to Vercel

### Access Vercel Project Settings

1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Click **Settings** → **Environment Variables**

### Add Required Variables

Add these environment variables:

```
DATABASE_URL=postgresql://postgres.abc123:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
ADMIN_PASSWORD=YourSecureAdminPassword
NODE_ENV=production
BASE_PATH=/
```

⚠️ **Important:**
- Replace the DATABASE_URL with your actual Supabase connection string
- Keep `ADMIN_PASSWORD` secure
- These variables should apply to **Production** environment

## 🚀 Step 2: Deploy

### Automatic Deployment

Push your code to GitHub:
```bash
git add .
git commit -m "Deploy production configuration"
git push origin main
```

Vercel will automatically:
1. Install dependencies: `pnpm install`
2. Generate Prisma client: `pnpm --filter @workspace/db run prisma:generate`
3. Run build: `pnpm run build`
4. Deploy to edge functions

### Manual Redeployment

In Vercel project page:
1. Click **Deployments** tab
2. Select latest deployment
3. Click **Redeploy** (if needed)

## ✅ Step 3: Monitor Deployment

### Check Build Logs

1. **In Vercel Dashboard:**
   - Click **Deployments**
   - Select the latest deployment
   - Click **Build Logs** tab
   - Watch for successful build and Prisma generation

### Expected Log Output

```
✓ Prisma Schema loaded from ./lib/db/prisma/schema.prisma
✓ Prisma Client generated successfully
✓ Packages installed
✓ TypeScript checks passed
✓ Build completed
```

### Check for Errors

Look for these errors in logs:

❌ **"`DATABASE_URL` is not set"**
- Solution: Add `DATABASE_URL` to Vercel environment variables
- Verify it's applied to the right environment (Production)

❌ **"Connection refused"**
- Solution: Verify Supabase IP whitelist includes Vercel
- Check DATABASE_URL format

❌ **"Prisma Client generation failed"**
- Solution: Run `pnpm --filter @workspace/db run prisma:generate` locally
- Commit generated files if needed

## 📊 Step 4: Initialize Database (First Deployment Only)

### Option A: Use Prisma CLI (Recommended)

After first deployment, initialize the database:

```bash
# From your local machine
export DATABASE_URL="your-supabase-connection-string"
pnpm --filter @workspace/db run prisma:migrate
```

### Option B: Use Supabase Console

If coming from Supabase-hosted database already:

1. Go to Supabase console
2. **SQL Editor** → Run these commands:

```sql
CREATE TABLE IF NOT EXISTS "faculty_submissions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "data" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "student_submissions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text,
  "email" text,
  "custom_field" text,
  "data" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);
```

## 🔄 Step 5: Test Deployment

### Health Check
```bash
curl https://your-domain.vercel.app/api/healthz
# Should return: {"status":"ok"}
```

### Test Faculty Submission
```bash
curl -X POST https://your-domain.vercel.app/api/faculty \
  -H "Content-Type: application/json" \
  -d '{
    "papersPublished": [],
    "booksChapters": [],
    "patentsGranted": [],
    "phdAwardees": []
  }'
```

### Test Admin Endpoints
```bash
curl -X POST https://your-domain.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YourAdminPassword"}'
```

## 🔐 Security Checklist

- ✅ DATABASE_URL added to Vercel (not committed to git)
- ✅ ADMIN_PASSWORD is strong (min 12 chars, mixed case)
- ✅ Environment variables set to Production only
- ✅ Supabase IP whitelist configured
- ✅ Row Level Security (RLS) configured if needed

## 🛠️ Advanced: Manual Migrations on Vercel

If you need to run migrations after deployment:

### Option 1: Using Vercel CLI
```bash
# Deploy with migration command
vercel env pull .env.local
export $(cat .env.local | xargs)
pnpm --filter @workspace/db run prisma:migrate
```

### Option 2: Using Supabase UI
1. Go to Supabase Dashboard
2. SQL Editor
3. Run migration scripts manually

## 🚨 Troubleshooting

### Build Fails with "Prisma Client Error"

**Error Message:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
# Add missing dependency locally
pnpm add @prisma/client -w

# Commit and push
git add .
git push origin main
```

### Database Connection Times Out

**Checklist:**
- [ ] DATABASE_URL format is correct
- [ ] Supabase project is active
- [ ] IP whitelist includes Vercel
- [ ] Connection string has correct password
- [ ] Using correct region endpoint

### API Returns 500 Error

**Check logs:**
1. Vercel Deployments → Function Logs
2. Check for Prisma errors
3. Verify database is accessible

**Common issues:**
- Environment variables not loaded during build
- Prisma migrations not run
- Wrong database selected

### Tables Don't Exist

**Solution:**
```bash
# Run migrations to create tables
pnpm --filter @workspace/db run prisma:migrate

# Or use Prisma push (dev only, not recommended for production)
pnpm --filter @workspace/db run prisma:push
```

## 📈 Monitoring

### Set Up Alerts

In Vercel:
1. **Settings** → **Alerts**
2. Enable notifications for:
   - Build failures
   - Deployment errors

### Check Prisma Generation

Monitor in **Deployments** → **Build Logs**:
```
✓ Prisma schema loaded
✓ Prisma Client generated successfully
```

## 🔄 Updates and Migrations

### Adding New Columns

1. **Update schema locally:**
```prisma
model FacultySubmission {
  // ...add new field...
}
```

2. **Create migration:**
```bash
pnpm --filter @workspace/db exec prisma migrate dev --name add_new_field
```

3. **Push to GitHub:**
```bash
git push origin main
```

4. **Vercel auto-deploys** and runs migration

## ✨ Deployment Checklist

Before hitting deploy:

- [ ] DATABASE_URL added to Vercel environment
- [ ] ADMIN_PASSWORD set to secure value
- [ ] All TypeScript errors fixed locally (`pnpm run typecheck`)
- [ ] Code tested locally (`pnpm run build`)
- [ ] Changes committed and pushed
- [ ] Vercel build logs show success
- [ ] Health check endpoint responds
- [ ] Test API endpoints work

## 📞 Getting Help

If deployment fails:

1. Check Vercel build logs (Deployments → Your Deployment → Logs)
2. Check environment variables are set
3. Verify DATABASE_URL format
4. Ensure Supabase is accessible
5. Contact support with build log excerpt

---

**Summary:** After setting environment variables in Vercel and pushing code, all builds will automatically generate Prisma client and deploy successfully. No manual database initialization needed for subsequent deployments once the schema is created.
