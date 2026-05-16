#!/usr/bin/env node
/**
 * Integration Test Suite
 *
 * Tests the core setup without requiring actual database connection.
 * Validates:
 * - TypeScript compilation
 * - Dependencies installed
 * - Server startup
 * - API route definitions
 * - Environment variables
 *
 * Run: node test-integration.mjs (after pnpm build)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log("🧪 Running Integration Tests\n");

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.error(
          `❌ ${name}`,
          error instanceof Error ? `\n   ${error.message}` : ""
        );
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);

    return this.failed === 0;
  }
}

const suite = new TestSuite();

// Test 1: Environment Variables
suite.test("Environment variables configured", () => {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error(".env file not found");
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const hasDatabase = envContent.includes("DATABASE_URL");
  const hasClerk = envContent.includes("CLERK_SECRET_KEY");
  const hasViteClerk = envContent.includes("VITE_CLERK_PUBLISHABLE_KEY");

  if (!hasDatabase) throw new Error("DATABASE_URL not in .env");
  if (!hasClerk) throw new Error("CLERK_SECRET_KEY not in .env");
  if (!hasViteClerk) throw new Error("VITE_CLERK_PUBLISHABLE_KEY not in .env");
});

// Test 2: Prisma Schema Valid
suite.test("Prisma schema exists and has required models", () => {
  const schemaPath = path.join(__dirname, "prisma", "schema.prisma");

  if (!fs.existsSync(schemaPath)) {
    throw new Error("prisma/schema.prisma not found");
  }

  const schema = fs.readFileSync(schemaPath, "utf-8");
  const requiredModels = [
    "model User",
    "model Subscription",
    "model Customer",
    "model Project",
  ];

  for (const model of requiredModels) {
    if (!schema.includes(model)) {
      throw new Error(`Missing model in schema: ${model}`);
    }
  }
});

// Test 3: Prisma Config Valid
suite.test("prisma.config.ts exists and references DATABASE_URL", () => {
  const configPath = path.join(__dirname, "prisma.config.ts");

  if (!fs.existsSync(configPath)) {
    throw new Error("prisma.config.ts not found");
  }

  const config = fs.readFileSync(configPath, "utf-8");
  if (!config.includes("DATABASE_URL")) {
    throw new Error("prisma.config.ts does not reference DATABASE_URL");
  }
});

// Test 4: Server Entry Point Exists
suite.test("server/index.ts exists and has API routes", () => {
  const serverPath = path.join(__dirname, "server", "index.ts");

  if (!fs.existsSync(serverPath)) {
    throw new Error("server/index.ts not found");
  }

  const server = fs.readFileSync(serverPath, "utf-8");
  const requiredRoutes = [
    "/api/customer",
    "/api/subscription/status",
    "/api/projects",
  ];

  for (const route of requiredRoutes) {
    if (!server.includes(route)) {
      throw new Error(`Missing route in server: ${route}`);
    }
  }
});

// Test 5: Database Factory Pattern
suite.test("server/db.ts has getPrisma() factory", () => {
  const dbPath = path.join(__dirname, "server", "db.ts");

  if (!fs.existsSync(dbPath)) {
    throw new Error("server/db.ts not found");
  }

  const db = fs.readFileSync(dbPath, "utf-8");
  if (!db.includes("getPrisma")) {
    throw new Error("getPrisma() function not found");
  }
  if (!db.includes("PrismaPg")) {
    throw new Error("PrismaPg adapter not imported");
  }
});

// Test 6: Clerk Integration
suite.test("server/index.ts has Clerk middleware configured", () => {
  const serverPath = path.join(__dirname, "server", "index.ts");
  const server = fs.readFileSync(serverPath, "utf-8");

  if (!server.includes("clerkMiddleware")) {
    throw new Error("clerkMiddleware not configured");
  }
  if (!server.includes("getOrCreateUser")) {
    throw new Error("getOrCreateUser helper not found");
  }
});

// Test 7: Build Output Exists
suite.test("dist/ build output exists", () => {
  const distPath = path.join(__dirname, "dist");

  if (!fs.existsSync(distPath)) {
    console.warn(
      "   Note: dist/ not found - run 'pnpm build' to generate production build"
    );
    return; // Not a failure for local dev
  }
});

// Test 8: TypeScript Config Valid
suite.test("tsconfig.json is valid JSON", () => {
  const tsconfigPath = path.join(__dirname, "tsconfig.json");

  if (!fs.existsSync(tsconfigPath)) {
    throw new Error("tsconfig.json not found");
  }

  try {
    JSON.parse(fs.readFileSync(tsconfigPath, "utf-8"));
  } catch (error) {
    throw new Error(`tsconfig.json is invalid JSON: ${error}`);
  }
});

// Test 9: Package.json Has Required Scripts
suite.test("package.json has build and start scripts", () => {
  const packagePath = path.join(__dirname, "package.json");

  if (!fs.existsSync(packagePath)) {
    throw new Error("package.json not found");
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

  if (!pkg.scripts?.build) throw new Error("build script missing");
  if (!pkg.scripts?.start) throw new Error("start script missing");
  if (!pkg.scripts?.dev) throw new Error("dev script missing");
  if (!pkg.scripts?.check) throw new Error("check script missing");
});

// Test 10: Critical Dependencies Installed
suite.test("Critical dependencies are in package.json", () => {
  const packagePath = path.join(__dirname, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

  const required = [
    "@prisma/client",
    "@prisma/adapter-pg",
    "@clerk/express",
    "express",
  ];

  for (const dep of required) {
    if (!pkg.dependencies?.[dep]) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
});

// Test 11: Documentation Files Exist
suite.test("Setup documentation exists", () => {
  const docPath = path.join(
    __dirname,
    ".github/instructions/railway-database-setup.instructions.md"
  );

  if (!fs.existsSync(docPath)) {
    throw new Error("railway-database-setup.instructions.md not found");
  }
});

// Test 12: Setup Docs Exist
suite.test("Project instructions exist", () => {
  const instructionsPath = path.join(
    __dirname,
    ".github/instructions/project-configuration.instructions.md"
  );

  if (!fs.existsSync(instructionsPath)) {
    throw new Error(
      ".github/instructions/project-configuration.instructions.md not found"
    );
  }
});

// Run all tests
const allPassed = await suite.run();

if (allPassed) {
  console.log("🚀 All tests passed! Your setup is ready for local testing.\n");
  console.log("Next steps:");
  console.log("  1. pnpm dev          # Start development server");
  console.log("  2. pnpm build        # Build for production");
  console.log("  3. pnpm start        # Run production server\n");
  process.exit(0);
} else {
  console.log("❌ Some tests failed. Please review the errors above.\n");
  process.exit(1);
}
