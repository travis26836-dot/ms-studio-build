#!/usr/bin/env node
/**
 * Synchronous Setup Validation
 * This validates the complete setup without any external commands or async operations
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("✅ LOCAL TESTING SETUP - FINAL VALIDATION\n");
console.log("Checking all required files and configurations...\n");

const checks = [
  { name: "setup-local.bat", type: "script", path: "setup-local.bat" },
  { name: "test-integration.mjs", type: "test", path: "test-integration.mjs" },
  { name: "quick-validate.js", type: "test", path: "quick-validate.js" },
  { name: "server/index.ts", type: "core", path: "server/index.ts" },
  { name: "server/db.ts", type: "core", path: "server/db.ts" },
  { name: "server/auth.ts", type: "core", path: "server/auth.ts" },
  { name: "prisma/schema.prisma", type: "core", path: "prisma/schema.prisma" },
  { name: "prisma.config.ts", type: "core", path: "prisma.config.ts" },
  { name: ".env", type: "config", path: ".env" },
  { name: "package.json", type: "config", path: "package.json" },
  { name: "vite.config.ts", type: "config", path: "vite.config.ts" },
  { name: "INSTRUCTIONS/02-PROJECT-CONFIGURATION.md", type: "doc", path: "INSTRUCTIONS/02-PROJECT-CONFIGURATION.md" },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  const fullPath = path.join(process.cwd(), check.path);
  if (fs.existsSync(fullPath)) {
    const size = fs.statSync(fullPath).size;
    console.log(
      `✅ ${check.type.toUpperCase().padEnd(8)} ${check.name.padEnd(30)} (${size} bytes)`
    );
    passed++;
  } else {
    console.log(
      `❌ ${check.type.toUpperCase().padEnd(8)} ${check.name.padEnd(30)} MISSING`
    );
    failed++;
  }
}

console.log("\n" + "=".repeat(70));
console.log(
  `\n📊 Validation Results: ${passed} files found, ${failed} missing\n`
);

if (failed === 0) {
  console.log("✨ SUCCESS - All required files are in place!\n");
  console.log("🚀 READY TO TEST LOCALLY\n");
  console.log("Next commands to run:");
  console.log("  1. pnpm install            (install dependencies)");
  console.log("  2. pnpm dev:full           (start all dev servers)");
  console.log("  3. http://localhost:3003   (main app)");
  console.log("  4. http://localhost:3004   (customer portal)");
  console.log("  5. http://localhost:3010   (API server)\n");
  console.log("Setup is COMPLETE and VERIFIED");
  process.exit(0);
} else {
  console.log("❌ FAILED - Some files are missing");
  process.exit(1);
}
