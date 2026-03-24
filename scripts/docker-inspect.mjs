#!/usr/bin/env node

/**
 * Docker Inspect Script - Detailed Docker resource information
 * 
 * Features:
 * - Shows all containers with status
 * - Shows all images with sizes
 * - Shows all volumes with usage
 * - Shows network configuration
 * - Shows disk usage summary
 * - Shows health check status
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
  projectName: 'python-worker',
  networkName: 'collabryx-network',
  imagePrefix: 'python-worker-',
  volumePrefix: 'collabryx-'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();
  } catch {
    return '';
  }
}

function checkDocker() {
  try {
    exec('docker --version');
    exec('docker ps');
    return true;
  } catch {
    log('❌ Docker is not installed or not running', 'red');
    process.exit(1);
  }
}

function showContainers() {
  log('\n' + '='.repeat(70), 'cyan');
  log('📦 CONTAINERS', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const containers = exec(`docker ps -a --filter "name=collabryx" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.State}}"`);
  
  if (containers) {
    log(containers, 'blue');
    
    // Detailed info for each container
    const containerIds = exec(`docker ps -a --filter "name=collabryx" --format "{{.ID}}"`).split('\n').filter(id => id);
    
    if (containerIds.length > 0) {
      log('\n📋 Detailed Information:', 'magenta');
      containerIds.forEach(id => {
        const inspect = exec(`docker inspect ${id} --format '{{.State.Status}}: {{.State.Health.Status}}'`);
        const name = exec(`docker inspect ${id} --format '{{.Name}}'`).replace('/', '');
        log(`   ${name}: ${inspect}`, 'gray');
      });
    }
  } else {
    log('   No Collabryx containers found', 'yellow');
  }
}

function showImages() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🖼️  IMAGES', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const images = exec(`docker images --filter "reference=${CONFIG.imagePrefix}*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"`);
  
  if (images) {
    log(images, 'blue');
    
    // Show dangling images
    const dangling = exec('docker images -f "dangling=true" --format "table {{.ID}}\t{{.Size}}\t{{.CreatedSince}}"');
    if (dangling) {
      log('\n⚠️  Dangling Images:', 'yellow');
      log(dangling, 'gray');
    }
  } else {
    log('   No project images found', 'yellow');
  }
}

function showVolumes() {
  log('\n' + '='.repeat(70), 'cyan');
  log('💾 VOLUMES', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const volumes = exec(`docker volume ls --filter "name=${CONFIG.volumePrefix}" --format "table {{.Name}}\t{{.Driver}}"`);
  
  if (volumes) {
    log(volumes, 'blue');
    
    // Show usage for each volume
    const volumeNames = exec(`docker volume ls --filter "name=${CONFIG.volumePrefix}" --format "{{.Name}}"`).split('\n').filter(name => name);
    
    if (volumeNames.length > 0) {
      log('\n📊 Volume Usage:', 'magenta');
      volumeNames.forEach(name => {
        const mountpoint = exec(`docker volume inspect ${name} --format '{{.Mountpoint}}'`);
        log(`   ${name}: ${mountpoint}`, 'gray');
      });
    }
  } else {
    log('   No project volumes found', 'yellow');
  }
}

function showNetworks() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🌐 NETWORKS', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const networks = exec(`docker network ls --filter "name=${CONFIG.networkName}" --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"`);
  
  if (networks) {
    log(networks, 'blue');
    
    // Show connected containers
    const networkIds = exec(`docker network ls --filter "name=${CONFIG.networkName}" --format "{{.ID}}"`).split('\n').filter(id => id);
    
    if (networkIds.length > 0) {
      log('\n🔗 Connected Containers:', 'magenta');
      networkIds.forEach(id => {
        const containers = exec(`docker network inspect ${id} --format '{{range .Containers}}{{.Name}} {{end}}'`);
        const name = exec(`docker network inspect ${id} --format '{{.Name}}'`);
        log(`   ${name}: ${containers || 'No containers'}`, 'gray');
      });
    }
  } else {
    log('   No project networks found', 'yellow');
  }
}

function showDiskUsage() {
  log('\n' + '='.repeat(70), 'cyan');
  log('💿 DISK USAGE', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const diskUsage = exec('docker system df');
  if (diskUsage) {
    log(diskUsage, 'blue');
  }
  
  // Show build cache
  const buildCache = exec('docker builder du -s');
  if (buildCache && !buildCache.includes('0B')) {
    log('\n🗑️  Build Cache:', 'magenta');
    log(buildCache, 'gray');
  }
}

async function showHealthChecks() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🏥 HEALTH CHECKS', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const containerIds = exec(`docker ps --filter "name=collabryx" --format "{{.ID}}"`).split('\n').filter(id => id);
  
  if (containerIds.length === 0) {
    log('   No running containers', 'yellow');
    return;
  }
  
  containerIds.forEach(id => {
    const name = exec(`docker inspect ${id} --format '{{.Name}}'`).replace('/', '');
    const health = exec(`docker inspect ${id} --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}No health check{{end}}'`);
    const logs = exec(`docker inspect ${id} --format '{{if .State.Health}}{{range .State.Health.Log}}{{.Output}}{{end}}{{end}}'`).substring(0, 100);
    
    const statusColor = health === 'healthy' ? 'green' : health === 'unhealthy' ? 'red' : 'yellow';
    log(`\n   📦 ${name}`, 'magenta');
    log(`      Status: ${health}`, statusColor);
    if (logs) {
      log(`      Last check: ${logs}...`, 'gray');
    }
  });
  
  // Try to fetch health endpoint
  log('\n🌐 Health Endpoint:', 'magenta');
  try {
    const health = exec('curl -s http://localhost:8000/health');
    if (health) {
      try {
        const parsed = JSON.parse(health);
        log(`   Status: ${parsed.status}`, parsed.status === 'healthy' ? 'green' : 'yellow');
        if (parsed.model_info) {
          log(`   Model: ${parsed.model_info.model_name}`, 'blue');
          log(`   Queue: ${parsed.queue_size}/${parsed.queue_capacity || 100}`, 'blue');
        }
      } catch {
        log(`   ${health}`, 'gray');
      }
    }
  } catch {
    log('   Could not fetch health endpoint', 'yellow');
  }
}

async function showEnvironment() {
  log('\n' + '='.repeat(70), 'cyan');
  log('⚙️  ENVIRONMENT', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const envFile = path.join(__dirname, '..', 'python-worker', '.env');
  try {
    const fs = await import('fs');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      const lines = content.split('\n').filter(line => line && !line.startsWith('#'));
      log(`   📄 .env file: ${lines.length} variables configured`, 'blue');
      lines.forEach(line => {
        const [key] = line.split('=');
        log(`      ✓ ${key}`, 'gray');
      });
    } else {
      log('   ⚠️  .env file not found', 'yellow');
      log('   Copy .env.example to .env and configure', 'yellow');
    }
  } catch {
    log('   Could not read .env file', 'yellow');
  }
}

async function main() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🔍 Docker Inspect - Complete Resource Overview', 'cyan');
  log('='.repeat(70), 'cyan');
  
  checkDocker();
  
  showContainers();
  showImages();
  showVolumes();
  showNetworks();
  showDiskUsage();
  await showHealthChecks();
  await showEnvironment();
  
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 QUICK COMMANDS', 'cyan');
  log('='.repeat(70), 'cyan');
  log('   Start: npm run docker:up', 'blue');
  log('   Stop: npm run docker:down', 'blue');
  log('   Rebuild: npm run docker:rebuild', 'blue');
  log('   Logs: npm run docker:logs', 'blue');
  log('   Clean: npm run docker:clean', 'blue');
  log('   Help: npm run docker:clean -- --help', 'blue');
  log('');
}

main();
