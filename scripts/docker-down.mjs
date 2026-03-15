#!/usr/bin/env node

/**
 * Docker Down Script - Clean container shutdown
 * 
 * Features:
 * - Stops all containers gracefully
 * - Removes containers and networks
 * - Optional volume cleanup
 * - Shows cleanup summary
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
  imageName: 'python-worker-embedding-service'
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
    // Return error output for debugging
    return error.stdout || error.stderr || error.message;
  }
}

function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    log('❌ Docker is not installed or not running', 'red');
    process.exit(1);
  }
}

function getContainerStatus() {
  try {
    const status = exec(`cd "${CONFIG.workerDir}" && docker-compose ps`);
    return status.trim();
  } catch (error) {
    return '';
  }
}

function stopContainers() {
  log('🛑 Stopping containers...', 'cyan');
  
  try {
    const downCommand = `cd "${CONFIG.workerDir}" && docker-compose down`;
    exec(downCommand, { stdio: 'inherit' });
    log('✅ Containers stopped', 'green');
    return true;
  } catch (error) {
    log('⚠️  Warning: Failed to stop containers cleanly', 'yellow');
    log(error.message, 'yellow');
    return false;
  }
}

function removeOrphanedContainers() {
  log('🧹 Cleaning up orphaned containers...', 'cyan');
  
  try {
    // Remove stopped containers
    exec('docker container prune -f', { stdio: 'pipe' });
    log('✅ Orphaned containers removed', 'green');
  } catch (error) {
    log('⚠️  Warning: Failed to remove orphaned containers', 'yellow');
  }
}

function removeUnusedNetworks() {
  log('🌐 Cleaning up unused networks...', 'cyan');
  
  try {
    exec('docker network prune -f', { stdio: 'pipe' });
    log('✅ Unused networks removed', 'green');
  } catch (error) {
    log('⚠️  Warning: Failed to remove unused networks', 'yellow');
  }
}

function showDiskUsage() {
  log('📊 Docker disk usage:', 'cyan');
  
  try {
    const usage = exec('docker system df');
    log(usage, 'blue');
  } catch (error) {
    log('Unable to get disk usage', 'yellow');
  }
}

function main() {
  const args = process.argv.slice(2);
  const clean = args.includes('--clean') || args.includes('-c');
  
  log('\n' + '='.repeat(60), 'cyan');
  log('🐳 Docker Down - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Check Docker
  checkDocker();
  
  // Show current status
  const status = getContainerStatus();
  if (status) {
    log('Current container status:', 'blue');
    log(status + '\n', 'blue');
  } else {
    log('⚠️  No containers running\n', 'yellow');
  }
  
  // Stop containers
  stopContainers();
  
  // Optional cleanup
  if (clean) {
    log('\n🧹 Performing deep cleanup...\n', 'yellow');
    removeOrphanedContainers();
    removeUnusedNetworks();
    showDiskUsage();
  }
  
  // Final status
  log('\n' + '='.repeat(60), 'green');
  log('✅ Docker containers stopped successfully', 'green');
  log('='.repeat(60) + '\n', 'green');
  
  if (clean) {
    log('💡 Tip: Run "npm run docker:up" to restart the service', 'cyan');
  }
  
  log('');
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
