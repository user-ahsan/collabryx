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

import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
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
  } catch (error) {
    log('❌ Docker is not installed or not running', 'red');
    log('Please install Docker Desktop: https://www.docker.com/products/docker-desktop', 'yellow');
    process.exit(1);
  }
}

function checkDockerRunning() {
  try {
    exec('docker ps');
    return true;
  } catch (error) {
    log('❌ Docker daemon is not running', 'red');
    log('Please start Docker Desktop', 'yellow');
    process.exit(1);
  }
}

function imageExists() {
  try {
    const output = exec(`docker images -q ${CONFIG.imageName}`);
    return output.trim().length > 0;
  } catch (error) {
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
  } catch (error) {
    log('❌ Failed to build Docker image', 'red');
    log(error.message, 'yellow');
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
  } catch (error) {
    log('❌ Failed to start container', 'red');
    log(error.message, 'yellow');
    process.exit(1);
  }
}

function checkHealth() {
  return new Promise((resolve, reject) => {
    let retries = 0;
    
    const interval = setInterval(() => {
      retries++;
      log(`⏳ Waiting for health check... (${retries}/${CONFIG.maxRetries})`, 'yellow');
      
      const http = require('http');
      
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

function getContainerStatus() {
  try {
    const status = exec(`cd "${CONFIG.workerDir}" && docker-compose ps`);
    return status;
  } catch (error) {
    return 'Container not running';
  }
}

async function waitForHealth() {
  log('🏥 Checking service health...', 'cyan');
  
  try {
    await checkHealth();
    log('✅ Service is healthy and ready!', 'green');
    return true;
  } catch (error) {
    log('❌ Service health check failed', 'red');
    log('Container status:', 'yellow');
    log(getContainerStatus(), 'yellow');
    log('\nTo view logs, run: npm run docker:logs', 'yellow');
    process.exit(1);
  }
}

function showSuccess() {
  log('\n' + '='.repeat(60), 'green');
  log('🎉 Docker container is up and running!', 'green');
  log('='.repeat(60), 'green');
  log(`\n📊 Service: ${CONFIG.serviceName}`, 'cyan');
  log(`🌐 Health: ${CONFIG.healthEndpoint}`, 'cyan');
  log(`📝 Logs: npm run docker:logs`, 'cyan');
  log(`🛑 Stop: npm run docker:down`, 'cyan');
  log(`\n${getContainerStatus()}`, 'blue');
  log('='.repeat(60) + '\n', 'green');
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🐳 Docker Up - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Step 1: Check Docker
  checkDocker();
  checkDockerRunning();
  
  // Step 2: Check if image exists, build if not
  if (!imageExists()) {
    log('📦 Image not found, building...', 'yellow');
    buildImage();
  } else {
    log('✅ Docker image found', 'green');
  }
  
  // Step 3: Start container
  startContainer();
  
  // Step 4: Wait for health check
  await waitForHealth();
  
  // Step 5: Show success message
  showSuccess();
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n\n⚠️  Process interrupted by user', 'yellow');
  process.exit(0);
});

main();
