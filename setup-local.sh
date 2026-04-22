#!/bin/bash
# Local Testing Script
# Run this to set up and test the project locally

set -e

echo "🧪 MS Studio Build - Local Testing Setup"
echo "========================================"
echo ""

# Check prerequisites
echo "1️⃣  Checking prerequisites..."
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm not found. Install it with: npm install -g pnpm"
  exit 1
fi
echo "✅ pnpm found"

if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found"
  exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js ${NODE_VERSION}"

# Check .env file
echo ""
echo "2️⃣  Checking environment configuration..."
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  exit 1
fi

if ! grep -q "DATABASE_URL" .env; then
  echo "❌ DATABASE_URL not set in .env"
  exit 1
fi
echo "✅ .env configured with DATABASE_URL"

if ! grep -q "CLERK_SECRET_KEY" .env; then
  echo "❌ CLERK_SECRET_KEY not set in .env"
  exit 1
fi
echo "✅ CLERK_SECRET_KEY configured"

# Install dependencies
echo ""
echo "3️⃣  Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"

# Generate Prisma client
echo ""
echo "4️⃣  Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"

# Apply database schema
echo ""
echo "5️⃣  Applying database schema..."
echo "   This will create tables in your Railway database..."
npx prisma db push --skip-generate
echo "✅ Database schema applied"

# Run type check
echo ""
echo "6️⃣  Running TypeScript validation..."
pnpm check
echo "✅ TypeScript validation passed"

# Success
echo ""
echo "✨ Setup complete!"
echo ""
echo "🚀 To start developing:"
echo "   pnpm dev"
echo ""
echo "📚 For testing guide, see: LOCAL-TESTING.md"
echo "📊 For validation report, see: SETUP-VALIDATION-REPORT.md"
