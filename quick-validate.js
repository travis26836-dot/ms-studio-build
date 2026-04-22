/**
 * Quick Local Validation
 * 
 * This script validates the setup is ready WITHOUT needing to run external commands.
 * It checks files, configuration, and dependencies are all in place.
 * 
 * Usage: node quick-validate.js
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function check(name, test) {
  try {
    test();
    results.passed.push(name);
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

function warn(name, message) {
  results.warnings.push({ name, message });
  console.warn(`⚠️  ${name}: ${message}`);
}

console.log('🔍 Validating Local Testing Setup\n');

// Check 1: .env file
check('.env file exists', () => {
  if (!fs.existsSync('.env')) throw new Error('.env not found');
});

check('.env has DATABASE_URL', () => {
  const env = fs.readFileSync('.env', 'utf-8');
  if (!env.includes('DATABASE_URL')) throw new Error('DATABASE_URL not in .env');
});

check('.env has CLERK_SECRET_KEY', () => {
  const env = fs.readFileSync('.env', 'utf-8');
  if (!env.includes('CLERK_SECRET_KEY')) throw new Error('CLERK_SECRET_KEY not in .env');
});

// Check 2: Prisma files
check('prisma/schema.prisma exists', () => {
  if (!fs.existsSync('prisma/schema.prisma')) throw new Error('schema.prisma not found');
});

check('prisma schema has User model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  if (!schema.includes('model User')) throw new Error('User model not found');
});

check('prisma schema has Subscription model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  if (!schema.includes('model Subscription')) throw new Error('Subscription model not found');
});

check('prisma schema has Customer model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  if (!schema.includes('model Customer')) throw new Error('Customer model not found');
});

check('prisma schema has Project model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf-8');
  if (!schema.includes('model Project')) throw new Error('Project model not found');
});

check('prisma.config.ts exists', () => {
  if (!fs.existsSync('prisma.config.ts')) throw new Error('prisma.config.ts not found');
});

// Check 3: Server files
check('server/index.ts exists', () => {
  if (!fs.existsSync('server/index.ts')) throw new Error('server/index.ts not found');
});

check('server/index.ts has API routes', () => {
  const server = fs.readFileSync('server/index.ts', 'utf-8');
  const routes = ['/api/customer', '/api/subscription/status', '/api/projects'];
  for (const route of routes) {
    if (!server.includes(route)) throw new Error(`Route ${route} not found`);
  }
});

check('server/index.ts has Clerk auth', () => {
  const server = fs.readFileSync('server/index.ts', 'utf-8');
  if (!server.includes('ClerkExpressWithAuth')) throw new Error('ClerkExpressWithAuth not found');
});

check('server/db.ts exists', () => {
  if (!fs.existsSync('server/db.ts')) throw new Error('server/db.ts not found');
});

check('server/db.ts has getPrisma factory', () => {
  const db = fs.readFileSync('server/db.ts', 'utf-8');
  if (!db.includes('getPrisma')) throw new Error('getPrisma not found');
});

check('server/db.ts uses PrismaPg adapter', () => {
  const db = fs.readFileSync('server/db.ts', 'utf-8');
  if (!db.includes('PrismaPg')) throw new Error('PrismaPg adapter not found');
});

// Check 4: Package.json
check('package.json exists', () => {
  if (!fs.existsSync('package.json')) throw new Error('package.json not found');
});

check('package.json has required scripts', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const scripts = ['dev', 'build', 'start', 'check'];
  for (const script of scripts) {
    if (!pkg.scripts?.[script]) throw new Error(`Script ${script} not found`);
  }
});

check('package.json has @prisma/client', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.dependencies?.['@prisma/client']) throw new Error('@prisma/client not in dependencies');
});

check('package.json has @prisma/adapter-pg', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.dependencies?.['@prisma/adapter-pg']) throw new Error('@prisma/adapter-pg not in dependencies');
});

check('package.json has express', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.dependencies?.['express']) throw new Error('express not in dependencies');
});

check('package.json has @clerk/clerk-sdk-node', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  if (!pkg.dependencies?.['@clerk/clerk-sdk-node']) throw new Error('@clerk/clerk-sdk-node not in dependencies');
});

// Check 5: Testing files
check('LOCAL-TESTING.md exists', () => {
  if (!fs.existsSync('LOCAL-TESTING.md')) throw new Error('LOCAL-TESTING.md not found');
});

check('TESTING-README.md exists', () => {
  if (!fs.existsSync('TESTING-README.md')) throw new Error('TESTING-README.md not found');
});

check('setup-local.sh exists', () => {
  if (!fs.existsSync('setup-local.sh')) throw new Error('setup-local.sh not found');
});

check('setup-local.bat exists', () => {
  if (!fs.existsSync('setup-local.bat')) throw new Error('setup-local.bat not found');
});

// Check 6: Prisma client generated
check('node_modules/@prisma/client exists', () => {
  if (!fs.existsSync('node_modules/@prisma/client')) {
    warn('Prisma client not yet generated', 'Run: npx prisma generate');
  }
});

check('node_modules/@prisma/adapter-pg exists', () => {
  if (!fs.existsSync('node_modules/@prisma/adapter-pg')) {
    warn('PrismaPg adapter not installed', 'Run: pnpm install @prisma/adapter-pg');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${results.passed.length} passed, ${results.failed.length} failed`);

if (results.warnings.length > 0) {
  console.log(`⚠️  ${results.warnings.length} warnings`);
}

if (results.failed.length === 0) {
  console.log('\n✨ All critical checks passed!');
  console.log('\n🚀 You are ready to test locally:');
  console.log('   bash setup-local.sh    # Automated setup');
  console.log('   OR');
  console.log('   pnpm dev               # Start dev server');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Review errors above.');
  process.exit(1);
}
