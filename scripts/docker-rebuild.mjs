#!/usr/bin/env node

/**
 * Docker Rebuild Script - Rebuild and restart all microservices
 * 
 * Features:
 * - Stops existing containers gracefully
 * - Removes old images
 * - Builds fresh images with no cache (all 4 services in sequence)
 * - Starts new containers
 * - Monitors health checks on all endpoints
 * - Provides detailed build logs per service
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

// Configuration
const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
  composeFile: path.join(__dirname, '..', 'python-worker', 'docker-compose.yml'),
  healthInterval: 3000,
  maxRetries: 40
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      ...options
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function execVerbose(command) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function checkDocker() {
  log('🐳 Checking Docker availability...', 'cyan');
  try {
    exec('docker --version');
    exec('docker ps');
    log('✅ Docker is running', 'green');
    return true;
  } catch (_error) {
    log('❌ Docker is not installed or not running', 'red');
    process.exit(1);
  }
}

function stopContainers() {
  log('\n🛑 Stopping existing containers...', 'cyan');
  
  try {
    execVerbose(`docker compose -f "${CONFIG.composeFile}" down --timeout 30`);
    log('✅ Containers stopped', 'green');
    return true;
  } catch (_error) {
    log('⚠️  No containers to stop', 'yellow');
    return false;
  }
}

function removeImages() {
  log('\n🗑️  Removing old images...', 'cyan');
  
  SERVICES.forEach(service => {
    const imageName = `python-worker_${service.name}`;
    try {
      const images = exec(`docker images -q ${imageName}`);
      if (images.trim()) {
        execVerbose(`docker rmi -f ${images.trim()}`);
        log(`   ✅ Removed image: ${imageName}`, 'green');
      }
    } catch (_error) {
      log(`   ⚠️  Could not remove image: ${imageName}`, 'yellow');
    }
  });
  
  return true;
}

function buildImages() {
  log('\n🔨 Building Docker images...', 'cyan');
  
  SERVICES.forEach(service => {
    log(`\n   Building ${service.name}...`, 'blue');
    const startTime = Date.now();
    try {
      execVerbose(`docker compose -f "${CONFIG.composeFile}" build ${service.name}`);
      const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`   ✅ ${service.name} built in ${buildTime}s`, 'green');
    } catch (error) {
      log(`   ❌ Failed to build ${service.name}`, 'red');
      log(error.message, 'red');
      process.exit(1);
    }
  });
  
  return true;
}

function startContainers() {
  log('\n🚀 Starting Docker containers...', 'cyan');
  
  try {
    execVerbose(`docker compose -f "${CONFIG.composeFile}" up -d`);
    log('✅ Containers started', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to start containers', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkServiceHealth(service) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      http.get(service.healthEndpoint, { timeout: 3000 }, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        // Continue retrying
      });
    }, CONFIG.healthInterval);
    
    setTimeout(() => {
      clearInterval(interval);
      resolve(false);
    }, CONFIG.healthInterval * CONFIG.maxRetries);
  });
}

async function checkAllHealth() {
  log('\n⏳ Waiting for all services to become healthy...', 'yellow');
  
  const results = await Promise.all(
    SERVICES.map(async (service) => {
      const healthy = await checkServiceHealth(service);
      if (healthy) {
        log(`   ✅ ${service.name} is healthy`, 'green');
      } else {
        log(`   ❌ ${service.name} failed health check`, 'red');
      }
      return healthy;
    })
  );
  
  return results.every(r => r === true);
}

async function displayHealthTable() {
  log('\n' + '='.repeat(55), 'cyan');
  log('📊 MICROSERVICES HEALTH STATUS', 'cyan');
  log('='.repeat(55), 'cyan');
  log(`  ${'Service'.padEnd(25)} ${'Port'.padEnd(8)} ${'Status'}`, 'blue');
  log('─'.repeat(55), 'cyan');
  
  for (const service of SERVICES) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(service.healthEndpoint, { timeout: 3000 }, (r) => {
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
  
  log('='.repeat(55), 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  const skipStop = args.includes('--no-stop');
  const skipRemove = args.includes('--no-remove');
  
  log('\n' + '='.repeat(60), 'cyan');
  log('🔨 Docker Rebuild - Rebuild & Restart All Microservices', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Check Docker
  checkDocker();
  
  // Stop containers
  if (!skipStop) {
    stopContainers();
  }
  
  // Remove old images
  if (!skipRemove) {
    removeImages();
  }
  
  // Build all images
  buildImages();
  
  // Start containers
  startContainers();
  
  // Wait for all health checks
  try {
    const allHealthy = await checkAllHealth();
    await displayHealthTable();
    
    if (allHealthy) {
      log('\n✅ All microservices rebuilt and running!', 'green');
    } else {
      log('\n⚠️  Some services may not be healthy', 'yellow');
    }
    
    log('\n📋 Useful commands:', 'cyan');
    log('   View logs:    bun run docker:logs', 'blue');
    log('   Check health: bun run docker:health', 'blue');
    log('   Check status: bun run docker:status', 'blue');
    log('');
  } catch (_error) {
    log('\n❌ Services failed to start properly', 'red');
    log('Check logs with: bun run docker:logs', 'yellow');
    process.exit(1);
  }
}

main();
