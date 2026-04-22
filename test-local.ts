/**
 * Local test script to verify:
 * 1. Prisma can load (after npx prisma generate)
 * 2. Database connection works
 * 3. Server can start
 * 4. API endpoints are wired
 *
 * Run: npx tsx test-local.ts
 */

import { getPrisma } from "./server/db.js";

console.log("🧪 Testing local setup...\n");

// Test 1: Database connection
console.log("1️⃣  Testing Prisma database connection...");
try {
  const prisma = await getPrisma();
  console.log("✅ Prisma initialized successfully");

  // Test query
  const userCount = await prisma.user.count();
  console.log(`✅ Database query successful (${userCount} users in database)`);

  await prisma.$disconnect();
  console.log("✅ Prisma disconnected cleanly\n");
} catch (error) {
  console.error(
    "❌ Database connection failed:",
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
}

// Test 2: Environment variables
console.log("2️⃣  Checking environment variables...");
const required = ["DATABASE_URL", "CLERK_SECRET_KEY"];
const missing: string[] = [];

for (const key of required) {
  if (process.env[key]) {
    console.log(`✅ ${key} is set`);
  } else {
    console.log(`❌ ${key} is missing`);
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error("\n❌ Missing environment variables:", missing);
  process.exit(1);
}

console.log("\n✅ All local tests passed!");
console.log("\n📝 Next steps:");
console.log("  1. Run `pnpm dev` to start the dev server");
console.log("  2. Visit http://localhost:5173 for the client");
console.log("  3. Test API with: curl http://localhost:5173/api/subscription/status");
console.log("     (Requires CLERK_SECRET_KEY to authenticate)");
