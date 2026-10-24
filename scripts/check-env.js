// scripts/check-env.js  →  node scripts/check-env.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const required = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_APP_URL'];
const warnings = [];
let ok = true;

console.log('\n🔍 Checking environment...\n');

for (const key of required) {
  if (!process.env[key]) {
    console.log('  ✗ ' + key + ' — MISSING');
    ok = false;
  } else {
    console.log('  ✓ ' + key + ' — set');
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  warnings.push('JWT_SECRET should be at least 32 characters');
}
if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.endsWith('/')) {
  warnings.push('NEXT_PUBLIC_APP_URL should not end with /');
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(w => console.log('   - ' + w));
}

if (!ok) {
  console.log('\n❌ Missing required env vars. See .env.example\n');
  process.exit(1);
}

console.log('\n✅ Environment looks good!\n');
