#!/usr/bin/env node

/**
 * Docker Up Script - Fully automated Docker container startup
 * 
 * Features:
 * - Auto-detects Docker availability
 * - Builds image if not exists
 * - Starts container with proper port mapping
 * - Waits for health check to pass
 * - Provides clear status messages
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
  serviceName: 'embedding-service',
  imageName: 'python-worker-embedding-service',
  port: 8000,
  healthEndpoint: 'http://localhost:8000/health',
  healthTimeout: 120000, // 2 minutes
  healthInterval: 3000, // 3 seconds
  maxRetries: 40
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

function checkDocker() {
  log('🐳 Checking Docker availability...', 'cyan');
  try {
    exec('docker --version');
    log('✅ Docker is installed', 'green');
    return true;
  } catch (_error) {
    log('❌ Docker is not installed or not running', 'red');
    log('Please install Docker Desktop: https://www.docker.com/products/docker-desktop', 'yellow');
    process.exit(1);
  }
}

function checkDockerRunning() {
  try {
    exec('docker ps');
    return true;
  } catch (_error) {
    log('❌ Docker daemon is not running', 'red');
    log('Please start Docker Desktop', 'yellow');
    process.exit(1);
  }
}

function imageExists() {
  try {
    const output = exec(`docker images -q ${CONFIG.imageName}`);
    return output.trim().length > 0;
  } catch (_error) {
    return false;
  }
}

function buildImage() {
  log('🔨 Building Docker image...', 'cyan');
  log(`   Directory: ${CONFIG.workerDir}`, 'blue');
  
  try {
    const buildCommand = `cd "${CONFIG.workerDir}" && docker-compose build --no-cache`;
    log(`   Running: ${buildCommand}`, 'blue');
    
    const result = exec(buildCommand, { stdio: 'inherit' });
    log('✅ Image built successfully', 'green');
    return true;
  } catch (_error) {
    log('❌ Failed to build Docker image', 'red');
    process.exit(1);
  }
}

function startContainer() {
  log('🚀 Starting Docker container...', 'cyan');
  
  try {
    const upCommand = `cd "${CONFIG.workerDir}" && docker-compose up -d`;
    exec(upCommand, { stdio: 'inherit' });
    log('✅ Container started', 'green');
    return true;
  } catch (_error) {
    log('❌ Failed to start containers', 'red');
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

async function main() {
  const args = process.argv.slice(2);
  const rebuild = args.includes('--rebuild') || args.includes('-r');
  
  log('\n' + '='.repeat(60), 'cyan');
  log('🐳 Docker Up - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Check Docker
  checkDocker();
  checkDockerRunning();
  
  // Build image if not exists or --rebuild flag
  if (rebuild || !imageExists()) {
    buildImage();
  }
  
  // Start container
  startContainer();
  
  // Wait for health check
  try {
    await checkHealth();
    log('\n✅ Service is up and running!', 'green');
    log(`🌐 Health endpoint: ${CONFIG.healthEndpoint}`, 'blue');
  } catch (_error) {
    log('\n❌ Service failed to start properly', 'red');
    log('Check logs with: npm run docker:logs', 'yellow');
    process.exit(1);
  }
}

main();
