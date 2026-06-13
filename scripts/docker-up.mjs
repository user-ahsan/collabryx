#!/usr/bin/env node

/**
 * Docker Up - Start Collabryx Microservices
 * Starts all 4 microservices and waits for each health endpoint
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICES = [
  { name: 'embedding-service',    port: 8000, healthEndpoint: 'http://localhost:8000/health' },
  { name: 'notification-service', port: 8002, healthEndpoint: 'http://localhost:8002/health' },
  { name: 'feed-service',         port: 8003, healthEndpoint: 'http://localhost:8003/health' },
  { name: 'match-service',        port: 8004, healthEndpoint: 'http://localhost:8004/health' }
];

const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
  maxRetries: 40,
  retryInterval: 3000
};

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
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (_error) {
    return '';
  }
}

function execVerbose(cmd) {
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
  } catch (_error) {
    throw new Error(`Command failed: ${cmd}`);
  }
}

function checkDocker() {
  try {
    exec('docker --version');
    exec('docker ps');
    return true;
  } catch (_error) {
    log('❌ Docker not running. Start Docker Desktop first.', 'red');
    process.exit(1);
  }
}

function isRunning() {
  const containers = exec(`docker ps --filter "name=python-worker" --filter "status=running" --format "{{.ID}}"`);
  return containers.trim().length > 0;
}

function start() {
  log('\n🚀 Starting Collabryx Microservices...', 'cyan');
  execVerbose(`cd "${CONFIG.workerDir}" && docker compose up -d`);
}

async function waitForService(service, retries) {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(service.healthEndpoint, { timeout: 2000 }, resolve).on('error', reject);
      });
      
      if (res.statusCode === 200) {
        log(`   ✅ ${service.name} running on port ${service.port}`, 'green');
        return true;
      }
    } catch (_error) {
      if (i % 5 === 0 || i === 1) {
        log(`   ⏳ ${service.name} - attempt ${i}/${retries}`, 'yellow');
      }
    }
    
    await new Promise(r => setTimeout(r, CONFIG.retryInterval));
  }
  
  log(`   ❌ ${service.name} failed to start on port ${service.port}`, 'red');
  return false;
}

async function waitForAllHealth() {
  log('\n⏳ Waiting for all services to become healthy...', 'yellow');
  
  const results = await Promise.all(
    SERVICES.map(service => waitForService(service, CONFIG.maxRetries))
  );
  
  return results.every(r => r === true);
}

async function showStatusTable() {
  log('\n📊 Microservices Status:', 'cyan');
  log('─'.repeat(55), 'cyan');
  log(`  ${'Service'.padEnd(25)} ${'Port'.padEnd(8)} ${'Status'}`, 'blue');
  log('─'.repeat(55), 'cyan');
  
  for (const service of SERVICES) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(service.healthEndpoint, { timeout: 2000 }, (r) => {
          let data = '';
          r.on('data', d => data += d);
          r.on('end', () => resolve({ statusCode: r.statusCode, data }));
        }).on('error', reject);
      });
      
      if (res.statusCode === 200) {
        try {
          const body = JSON.parse(res.data);
          const status = body.status === 'healthy' ? '✅ Healthy' : '⚠️ ' + body.status;
          log(`  ${service.name.padEnd(25)} ${String(service.port).padEnd(8)} ${status}`, 'green');
        } catch {
          log(`  ${service.name.padEnd(25)} ${String(service.port).padEnd(8)} ✅ Running`, 'green');
        }
      } else {
        log(`  ${service.name.padEnd(25)} ${String(service.port).padEnd(8)} ❌ Unhealthy`, 'red');
      }
    } catch {
      log(`  ${service.name.padEnd(25)} ${String(service.port).padEnd(8)} ❌ Down`, 'red');
    }
  }
  
  log('─'.repeat(55), 'cyan');
}

async function main() {
  log('\n' + '='.repeat(55), 'cyan');
  log('🐳 Collabryx Microservices - Docker Up', 'cyan');
  log('='.repeat(55), 'cyan');
  
  checkDocker();
  
  if (isRunning()) {
    log('✅ Services already running', 'green');
    for (const service of SERVICES) {
      log(`   ${service.name}: port ${service.port}`, 'cyan');
    }
    log('   Logs: bun run docker:logs', 'cyan');
    return;
  }
  
  start();
  
  try {
    const allHealthy = await waitForAllHealth();
    await showStatusTable();
    
    if (allHealthy) {
      log('\n✅ All microservices are running!', 'green');
    } else {
      log('\n⚠️  Some services may not be healthy', 'yellow');
      log('   Check logs: bun run docker:logs', 'yellow');
    }
    
    log('\n💡 Commands:', 'cyan');
    log('   Logs: bun run docker:logs', 'cyan');
    log('   Stop: bun run docker:down', 'cyan');
    log('   Rebuild: bun run docker:rebuild', 'cyan');
    log('');
  } catch (_error) {
    log('\n❌ Failed to start', 'red');
    log('   Check: bun run docker:logs', 'yellow');
    process.exit(1);
  }
}

main();
