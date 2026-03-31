// prisma/seed.ts - Optional: Seed data for migrations
// This file can be used to populate initial data after migrations

import { prisma } from "../src/prisma-client.js";

async function main() {
  console.log("Database is ready for migrations.");
  console.log(
    "Run migrations with: pnpm --filter @workspace/db run prisma:migrate"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
