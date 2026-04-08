#!/usr/bin/env node

/**
 * Docker Down - Stop Python Worker Service
 * Simple, clean shutdown
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker')
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function execVerbose(cmd) {
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
  } catch (_error) {
    // Ignore errors
  }
}

function main() {
  log('\n' + '='.repeat(50), 'cyan');
  log('🛑 Stopping Collabryx Worker', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const clean = process.argv.includes('--clean') || process.argv.includes('-c');
  
  if (clean) {
    log('\n🧹 Full cleanup (containers + volumes)...', 'cyan');
    execVerbose(`cd "${CONFIG.workerDir}" && docker-compose down -v`);
  } else {
    log('\n⏹️  Stopping containers...', 'cyan');
    execVerbose(`cd "${CONFIG.workerDir}" && docker-compose down`);
  }
  
  log('\n✅ Stopped', 'green');
  log('\n💡 Commands:', 'cyan');
  log('   Start: npm run docker:up', 'cyan');
  log('   Rebuild: npm run docker:rebuild', 'cyan');
  log('');
}

main();
