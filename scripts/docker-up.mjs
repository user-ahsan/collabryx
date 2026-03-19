#!/usr/bin/env node

/**
 * Docker Up - Start Python Worker Service
 * Simple, robust, with clear status messages
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
  port: 8000,
  healthEndpoint: 'http://localhost:8000/health',
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
  } catch (e) {
    return '';
  }
}

function execVerbose(cmd) {
  try {
    execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
  } catch (e) {
    throw new Error(`Command failed: ${cmd}`);
  }
}

function checkDocker() {
  try {
    exec('docker --version');
    exec('docker ps');
    return true;
  } catch {
    log('❌ Docker not running. Start Docker Desktop first.', 'red');
    process.exit(1);
  }
}

function isRunning() {
  const containers = exec(`docker ps --filter "name=collabryx-worker" --filter "status=running" --format "{{.ID}}"`);
  return containers.trim().length > 0;
}

function start() {
  log('\n🚀 Starting Collabryx Worker...', 'cyan');
  execVerbose(`cd "${CONFIG.workerDir}" && docker-compose up -d`);
}

async function waitForHealth() {
  log('⏳ Waiting for service...', 'yellow');
  
  for (let i = 1; i <= CONFIG.maxRetries; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(CONFIG.healthEndpoint, { timeout: 2000 }, resolve).on('error', reject);
      });
      
      if (res.statusCode === 200) {
        log(`✅ Service running on port ${CONFIG.port}`, 'green');
        return true;
      }
    } catch {
      log(`   Attempt ${i}/${CONFIG.maxRetries}`, 'yellow');
    }
    
    await new Promise(r => setTimeout(r, CONFIG.retryInterval));
  }
  
  throw new Error('Service failed to start');
}

async function showStatus() {
  try {
    const res = await new Promise((resolve, reject) => {
      let data = '';
      http.get(CONFIG.healthEndpoint, { timeout: 2000 }, (r) => {
        r.on('data', d => data += d);
        r.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });
    
    log('\n📊 Status:', 'cyan');
    log(`   Health: ${res.status === 'healthy' ? '✅' : '⚠️'} ${res.status}`, res.status === 'healthy' ? 'green' : 'yellow');
    log(`   Queue: ${res.queue_size || 0} items`, 'cyan');
    if (res.model_info) {
      log(`   Model: ${res.model_info.model_name}`, 'cyan');
    }
  } catch {
    log('   (Status unavailable)', 'yellow');
  }
}

async function main() {
  log('\n' + '='.repeat(50), 'cyan');
  log('🐳 Collabryx Worker - Docker Up', 'cyan');
  log('='.repeat(50), 'cyan');
  
  checkDocker();
  
  if (isRunning()) {
    log('✅ Service already running', 'green');
    log(`   Port: ${CONFIG.port}`, 'cyan');
    log('   Logs: npm run docker:logs', 'cyan');
    return;
  }
  
  start();
  
  try {
    await waitForHealth();
    await showStatus();
    log('\n💡 Commands:', 'cyan');
    log('   Logs: npm run docker:logs', 'cyan');
    log('   Stop: npm run docker:down', 'cyan');
    log('   Rebuild: npm run docker:rebuild', 'cyan');
    log('');
  } catch (e) {
    log('\n❌ Failed to start', 'red');
    log('   Check: npm run docker:logs', 'yellow');
    process.exit(1);
  }
}

main();
