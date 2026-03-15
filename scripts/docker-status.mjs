#!/usr/bin/env node

/**
 * Docker Status Script - Comprehensive service status
 * 
 * Features:
 * - Shows container status
 * - Displays resource usage
 * - Shows network configuration
 * - Lists volumes and images
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import http from 'http';

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
  } catch (_error) {
    return null;
  }
}

function getContainerStatus() {
  try {
    const status = exec(`cd "${CONFIG.workerDir}" && docker-compose ps`);
    return status.trim();
  } catch (_error) {
    return '';
  }
}

function getImageInfo() {
  try {
    const info = exec(`docker images ${CONFIG.imageName} --format "{{.Repository}}:{{.Tag}} - Created: {{.CreatedAt}} - Size: {{.Size}}"`);
    return info.trim();
  } catch (_error) {
    return null;
  }
}

function getContainerStats() {
  try {
    const stats = exec(`docker stats ${CONFIG.serviceName} --no-stream --format "CPU: {{.CPUPerc}}, Memory: {{.MemUsage}}, Network I/O: {{.NetIO}}"`);
    return stats.trim();
  } catch (_error) {
    return null;
  }
}

function getNetworkInfo() {
  try {
    const networks = exec(`cd "${CONFIG.workerDir}" && docker-compose ps --format json`);
    return networks.trim();
  } catch (_error) {
    return null;
  }
}

function getVolumeInfo() {
  try {
    const volumes = exec('docker volume ls --format "{{.Name}}"');
    return volumes.trim().split('\n').filter(v => v.includes('collabryx') || v.includes('python-worker'));
  } catch (_error) {
    return [];
  }
}

function checkPort() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.setTimeout(1000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(8000, 'localhost');
  });
}

async function displayStatus() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Docker Status - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Container Status
  log('📦 Container Status:', 'blue');
  const containerStatus = getContainerStatus();
  if (containerStatus) {
    log(`   ${containerStatus}`, containerStatus.includes('running') ? 'green' : 'yellow');
  } else {
    log('   No containers found', 'red');
  }
  
  // Image Info
  log('\n🖼️  Image Info:', 'blue');
  const imageInfo = getImageInfo();
  if (imageInfo) {
    log(`   ${imageInfo}`, 'cyan');
  } else {
    log('   Image not found', 'red');
  }
  
  // Resource Usage
  log('\n💾 Resource Usage:', 'blue');
  const stats = getContainerStats();
  if (stats) {
    log(`   ${stats}`, 'cyan');
  } else {
    log('   Container not running', 'yellow');
  }
  
  // Port Check
  log('\n🔌 Port Check:', 'blue');
  const portOpen = await checkPort();
  if (portOpen) {
    log('   Port 8000: ✅ OPEN', 'green');
  } else {
    log('   Port 8000: ❌ CLOSED', 'red');
  }
  
  // Network Info
  log('\n🌐 Network:', 'blue');
  try {
    const networks = exec('docker network ls --format "{{.Name}}"');
    const collabryxNetwork = networks.trim().split('\n').find(n => n.includes('collabryx'));
    if (collabryxNetwork) {
      log(`   ${collabryxNetwork}`, 'green');
    } else {
      log('   No collabryx network found', 'yellow');
    }
  } catch (_error) {
    log('❌ Failed to get container status', 'red');
  }
  
  // Volumes
  log('\n📁 Volumes:', 'blue');
  const volumes = getVolumeInfo();
  if (volumes.length > 0) {
    volumes.forEach(v => log(`   ${v}`, 'cyan'));
  } else {
    log('   No volumes found', 'yellow');
  }
  
  // Health Check
  log('\n🏥 Health Endpoint:', 'blue');
  try {
    const response = await new Promise((resolve, reject) => {
      http.get(CONFIG.healthEndpoint, { timeout: 2000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: jsonData
            });
          } catch {
            resolve({
              statusCode: res.statusCode,
              data: data
            });
          }
        });
      }).on('error', (err) => reject(err));
    });
    
    if (response.statusCode === 200 && response.data.status === 'healthy') {
      log('✅ Worker is healthy', 'green');
      log(JSON.stringify(response.data, null, 2), 'dim');
    } else {
      log('⚠️  Worker responded but may not be healthy', 'yellow');
      log(JSON.stringify(response, null, 2), 'dim');
    }
  } catch {
    log('❌ Health check failed', 'red');
  }
  
  log(''); // Empty line
  log('='.repeat(60), 'cyan');
}

function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🐳 Docker Status - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Container Status
  log('📦 Container Status:', 'blue');
  const containerStatus = getContainerStatus();
  if (containerStatus) {
    log(containerStatus, 'green');
  } else {
    log('   No containers running', 'yellow');
  }
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

main();
