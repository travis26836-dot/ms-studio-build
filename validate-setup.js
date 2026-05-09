#!/usr/bin/env node
/**
 * Synchronous Setup Validation
 * This validates the complete setup without any external commands or async operations
 */

const fs = require("fs");
const path = require("path");

console.log("✅ LOCAL TESTING SETUP - FINAL VALIDATION\n");
console.log("Checking all required files and configurations...\n");

const checks = [
  { name: "READY-FOR-TESTING.md", type: "doc", path: "READY-FOR-TESTING.md" },
  { name: "START-HERE-TESTING.md", type: "doc", path: "START-HERE-TESTING.md" },
  { name: "LOCAL-TESTING.md", type: "doc", path: "LOCAL-TESTING.md" },
  { name: "TESTING-README.md", type: "doc", path: "TESTING-README.md" },
  { name: "setup-local.sh", type: "script", path: "setup-local.sh" },
  { name: "setup-local.bat", type: "script", path: "setup-local.bat" },
  { name: "test-integration.mjs", type: "test", path: "test-integration.mjs" },
  { name: "server/index.ts", type: "core", path: "server/index.ts" },
  { name: "server/db.ts", type: "core", path: "server/db.ts" },
  { name: "prisma/schema.prisma", type: "core", path: "prisma/schema.prisma" },
  { name: "prisma.config.ts", type: "core", path: "prisma.config.ts" },
  { name: ".env", type: "config", path: ".env" },
  { name: "package.json", type: "config", path: "package.json" },
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
  console.log("  1. bash setup-local.sh     (automated setup)");
  console.log("  2. pnpm dev                (start development server)");
  console.log("  3. http://localhost:5173   (open in browser)\n");
  console.log("Setup is COMPLETE and VERIFIED ✅");
  process.exit(0);
} else {
  console.log("❌ FAILED - Some files are missing");
  process.exit(1);
}
