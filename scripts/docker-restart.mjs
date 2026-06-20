#!/usr/bin/env node

/**
 * Docker Restart - Restart all Collabryx microservices
 * Stops then starts all containers
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function exec(cmd) {
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
}

function main() {
  log('\n' + '='.repeat(50), 'cyan');
  log('🔄 Restarting Collabryx Microservices', 'cyan');
  log('='.repeat(50), 'cyan');

  log('\n⏹️  Stopping containers...', 'yellow');
  exec(`bun "${path.join(__dirname, 'docker-down.mjs')}"`);

  log('\n🚀 Starting containers...', 'yellow');
  exec(`bun "${path.join(__dirname, 'docker-up.mjs')}"`);

  log('\n✅ Restart complete', 'green');
  log('');
}

main();
