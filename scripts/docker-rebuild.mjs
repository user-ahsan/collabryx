#!/usr/bin/env node

/**
 * Docker Rebuild Script - Rebuild and restart with detailed logging
 * 
 * Features:
 * - Stops existing containers gracefully
 * - Removes old images
 * - Builds fresh image with no cache
 * - Starts new containers
 * - Monitors health check
 * - Provides detailed build logs
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
  serviceName: 'collabryx-worker',
  imageName: 'python-worker-collabryx-worker',
  port: 8000,
  healthEndpoint: 'http://localhost:8000/health',
  healthTimeout: 120000,
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
  } catch {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function execVerbose(command) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
    });
  } catch {
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
  } catch {
    log('❌ Docker is not installed or not running', 'red');
    process.exit(1);
  }
}

function stopContainers() {
  log('\n🛑 Stopping existing containers...', 'cyan');
  
  try {
    execVerbose(`cd "${CONFIG.workerDir}" && docker-compose down --timeout 30`);
    log('✅ Containers stopped', 'green');
    return true;
  } catch {
    log('⚠️  No containers to stop', 'yellow');
    return false;
  }
}

function removeImages() {
  log('\n🗑️  Removing old images...', 'cyan');
  
  try {
    const images = exec(`docker images -q ${CONFIG.imageName}`);
    if (images.trim()) {
      execVerbose(`docker rmi -f ${images.trim()}`);
      log('✅ Old images removed', 'green');
      return true;
    } else {
      log('ℹ️  No old images to remove', 'blue');
      return false;
    }
  } catch {
    log('⚠️  Could not remove images', 'yellow');
    return false;
  }
}

function buildImage() {
  log('\n🔨 Building Docker image...', 'cyan');
  log(`   Directory: ${CONFIG.workerDir}`, 'blue');
  log(`   Image: ${CONFIG.imageName}`, 'blue');
  log(`   No cache: true`, 'blue');
  
  try {
    const startTime = Date.now();
    execVerbose(`cd "${CONFIG.workerDir}" && docker-compose build --no-cache`);
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✅ Image built successfully in ${buildTime}s`, 'green');
    return true;
  } catch {
    log('❌ Failed to build Docker image', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function startContainers() {
  log('\n🚀 Starting Docker containers...', 'cyan');
  
  try {
    execVerbose(`cd "${CONFIG.workerDir}" && docker-compose up -d`);
    log('✅ Containers started', 'green');
    return true;
  } catch {
    log('❌ Failed to start containers', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkHealth() {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const interval = setInterval(() => {
      retries++;
      log(`⏳ Waiting for health check... (${retries}/${CONFIG.maxRetries})`, 'yellow');
      
      http.get(CONFIG.healthEndpoint, { timeout: 3000 }, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        // Continue retrying
      });
      
      if (retries >= CONFIG.maxRetries) {
        clearInterval(interval);
        reject(new Error('Health check timeout'));
      }
    }, CONFIG.healthInterval);
  });
}

async function getHealthDetails() {
  return new Promise((resolve) => {
    http.get(CONFIG.healthEndpoint, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

async function displayHealthStatus() {
  const health = await getHealthDetails();
  if (!health) return;

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 HEALTH STATUS', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`   Status: ${health.status === 'healthy' ? '✅ Healthy' : '⚠️  ' + health.status}`, health.status === 'healthy' ? 'green' : 'yellow');
  log(`   Supabase: ${health.supabase_connected ? '✅ Connected' : '❌ Disconnected'}`, health.supabase_connected ? 'green' : 'red');
  
  if (health.model_info) {
    log(`   Model: ${health.model_info.model_name}`, 'blue');
    log(`   Dimensions: ${health.model_info.dimensions}`, 'blue');
    log(`   Device: ${health.model_info.device}`, 'blue');
  }
  
  if (health.queue_size !== undefined) {
    const queueStatus = health.queue_size < 50 ? '✅' : health.queue_size < 80 ? '⚠️' : '❌';
    log(`   Queue: ${queueStatus} ${health.queue_size}/${health.queue_capacity || 100}`, 
      health.queue_size < 50 ? 'green' : health.queue_size < 80 ? 'yellow' : 'red');
  }
  
  if (health.memory_usage) {
    log(`   Memory: ${health.memory_usage.percent.toFixed(1)}% used`, 
      health.memory_usage.percent < 80 ? 'green' : 'yellow');
  }
  
  if (health.disk_usage) {
    log(`   Disk: ${health.disk_usage.percent.toFixed(1)}% used`, 
      health.disk_usage.percent < 80 ? 'green' : 'yellow');
  }
  
  log('='.repeat(60), 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  const skipStop = args.includes('--no-stop');
  const skipRemove = args.includes('--no-remove');
  
  log('\n' + '='.repeat(60), 'cyan');
  log('🔨 Docker Rebuild - Complete Rebuild & Restart', 'cyan');
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
  
  // Build image
  buildImage();
  
  // Start containers
  startContainers();
  
  // Wait for health check
  try {
    await checkHealth();
    log('\n✅ Service rebuilt and running!', 'green');
    log(`🌐 Health endpoint: ${CONFIG.healthEndpoint}`, 'blue');
    
    // Display detailed health status
    await displayHealthStatus();
    
    log('\n📋 Useful commands:', 'cyan');
    log('   View logs: npm run docker:logs', 'blue');
    log('   Monitor health: npm run docker:health:monitor', 'blue');
    log('   Check status: npm run docker:status', 'blue');
    log('');
  } catch {
    log('\n❌ Service failed to start properly', 'red');
    log('Check logs with: npm run docker:logs', 'yellow');
    process.exit(1);
  }
}

main();
