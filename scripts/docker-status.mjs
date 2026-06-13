#!/usr/bin/env node

/**
 * Docker Status Script - Comprehensive microservices status
 * 
 * Features:
 * - Shows container status for all 4 microservices
 * - Displays resource usage
 * - Shows network configuration
 * - Lists volumes and images
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICES = [
  { name: 'embedding-service',    port: 8000 },
  { name: 'notification-service', port: 8002 },
  { name: 'feed-service',         port: 8003 },
  { name: 'match-service',        port: 8004 }
];

// Configuration
const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker')
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
    const status = exec(`cd "${CONFIG.workerDir}" && docker compose ps`);
    return status.trim();
  } catch (_error) {
    return '';
  }
}

function _getImageInfo() {
  try {
    const info = exec(`docker images ${CONFIG.imageName} --format "{{.Repository}}:{{.Tag}} - Created: {{.CreatedAt}} - Size: {{.Size}}"`);
    return info.trim();
  } catch (_error) {
    return null;
  }
}

function _getContainerStats() {
  try {
    const stats = exec(`docker stats ${CONFIG.serviceName} --no-stream --format "CPU: {{.CPUPerc}}, Memory: {{.MemUsage}}, Network I/O: {{.NetIO}}"`);
    return stats.trim();
  } catch (_error) {
    return null;
  }
}

function _getNetworkInfo() {
  try {
    const networks = exec(`cd "${CONFIG.workerDir}" && docker compose ps --format json`);
    return networks.trim();
  } catch (_error) {
    return null;
  }
}

function _getVolumeInfo() {
  try {
    const volumes = exec('docker volume ls --format "{{.Name}}"');
    return volumes.trim().split('\n').filter(v => v.includes('collabryx') || v.includes('python-worker'));
  } catch (_error) {
    return [];
  }
}

function _checkPort() {
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



function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🐳 Docker Status - Collabryx Microservices', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Container Status
  log('📦 Container Status:', 'blue');
  const containerStatus = getContainerStatus();
  if (containerStatus) {
    log(containerStatus, 'green');
  } else {
    log('   No containers running', 'yellow');
  }
  
  // Port status
  log('\n🔌 Port Status:', 'blue');
  SERVICES.forEach(service => {
    const socket = new net.Socket();
    let checked = false;
    socket.setTimeout(1000);
    socket.on('connect', () => {
      if (!checked) {
        checked = true;
        log(`   ${service.name.padEnd(25)} ${String(service.port).padEnd(8)} ✅ Open`, 'green');
        socket.destroy();
      }
    });
    socket.on('error', () => {
      if (!checked) {
        checked = true;
        log(`   ${service.name.padEnd(25)} ${String(service.port).padEnd(8)} ❌ Closed`, 'red');
      }
    });
    socket.connect(service.port, 'localhost');
  });
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

main();
