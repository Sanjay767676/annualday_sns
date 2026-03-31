# @workspace/db - Database Package

This package manages all database operations and migrations for the Annual Day SNS application.

## 🏗️ Architecture

- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Primary database (supports Supabase)
- **Migrations**: Version-controlled schema evolution
- **Drizzle (Legacy)**: Existing code uses Drizzle, being gradually migrated to Prisma

## 🔧 Configuration

### Database Connection

Set the `DATABASE_URL` environment variable:

```bash
# Local development
export DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Supabase example
export DATABASE_URL="postgresql://postgres.abc123:password@aws-0-region.pooler.supabase.com:6543/postgres"
```

## 📋 Available Scripts

```bash
# Generate Prisma Client (required before running app)
pnpm run prisma:generate

# Run pending migrations
pnpm run prisma:migrate

# Push schema to database (without migrations - dev only)
pnpm run prisma:push

# Legacy Drizzle commands (keep for backward compatibility)
pnpm run push
pnpm run push-force
```

## 📊 Database Schema

### Entities

#### FacultySubmission
```prisma
model FacultySubmission {
  id        String   @id @default(uuid())
  data      Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
}
```

#### StudentSubmission
```prisma
model StudentSubmission {
  id        String   @id @default(uuid())
  name      String?
  email     String?
  customField String? @map("custom_field")
  data      Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
}
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd lib/db
pnpm install
```

### 2. Generate Prisma Client
```bash
pnpm run prisma:generate
```

### 3. Run Migrations
```bash
pnpm run prisma:migrate
```

### 4. (Optional) Open Prisma Studio
```bash
# Note: Add "studio": "prisma studio --schema=./prisma/schema.prisma" to scripts first
pnpm run prisma:studio
```

## 🔄 Creating New Migrations

### Development Workflow
```bash
# 1. Modify schema.prisma
nano prisma/schema.prisma

# 2. Create migration
pnpm exec prisma migrate dev --name add_new_feature

# 3. Test locally
pnpm run build
```

### Vercel Deployment
Migrations are automatically applied during build:

```bash
# Vercel runs this (configured in vercel.json)
pnpm run prisma:generate && pnpm run build

# Then during runtime, migrations are safe to deploy
```

## 🔐 Migration Best Practices

✅ **DO**
- Test migrations locally before pushing
- Use descriptive migration names: `add_user_table`, `add_email_index`
- Review schema changes in PR
- Generate types after schema changes

❌ **DON'T**
- Modify migrations directly
- Skip migrations before deployment
- Use destructive operations in production migrations

## 📦 Exports

```typescript
// From @workspace/db
import { prisma } from "@workspace/db";
import { db, sql, gte } from "@workspace/db"; // Drizzle (legacy)

// Prisma usage
const submission = await prisma.facultySubmission.create({
  data: { data: {...} }
});
```

## 🐛 Troubleshooting

### "Prisma client not found"
```bash
pnpm run prisma:generate
```

### "Migration failed"
```bash
# Check status
pnpm exec prisma migrate status

# Resolve and retry
pnpm run prisma:migrate
```

### "Connection refused"
- Verify `DATABASE_URL` is correct
- Ensure database is running
- Check firewall/network settings

### "Type errors in generated code"
```bash
# Regenerate types
pnpm run prisma:generate
```

## 📚 Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

This package is part of the monorepo. Run commands from root:
```bash
pnpm --filter @workspace/db run <script>
```
