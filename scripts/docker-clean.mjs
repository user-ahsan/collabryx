#!/usr/bin/env node

/**
 * Docker Clean Script - Complete cleanup of all Docker resources
 * 
 * Features:
 * - Stops and removes all containers
 * - Removes all images (including dangling)
 * - Removes all volumes (with confirmation)
 * - Removes build cache
 * - Removes networks
 * - Provides detailed cleanup report
 * 
 * Usage:
 *   npm run docker:clean              # Interactive cleanup
 *   npm run docker:clean -- --force   # Skip confirmations
 *   npm run docker:clean -- --volumes # Include volumes in cleanup
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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
    // Return empty string if command fails (e.g., no containers to remove)
    return '';
  }
}

function execVerbose(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.toLowerCase());
  }));
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
    log('Please install Docker Desktop: https://www.docker.com/products/docker-desktop', 'yellow');
    process.exit(1);
  }
}

function getContainers() {
  const output = exec('docker ps -a --filter "name=collabryx" --format "{{.ID}}"');
  return output.trim().split('\n').filter(id => id.length > 0);
}

function getImages() {
  const output = exec(`docker images --filter "reference=${CONFIG.imagePrefix}*" --format "{{.ID}}"`);
  return output.trim().split('\n').filter(id => id.length > 0);
}

function getVolumes() {
  const output = exec(`docker volume ls --filter "name=${CONFIG.volumePrefix}" --format "{{.Name}}"`);
  return output.trim().split('\n').filter(name => name.length > 0);
}

function getNetworks() {
  const output = exec(`docker network ls --filter "name=${CONFIG.networkName}" --format "{{.ID}}"`);
  return output.trim().split('\n').filter(id => id.length > 0);
}

function getDanglingImages() {
  const output = exec('docker images -f "dangling=true" -q');
  return output.trim().split('\n').filter(id => id.length > 0);
}

function getBuildCache() {
  const output = exec('docker builder du -s');
  return output.trim();
}

async function confirmCleanup(itemType, count) {
  if (count === 0) return true;
  
  const answer = await askQuestion(
    `${colors.yellow}⚠️  Remove ${count} ${itemType}? (yes/no): ${colors.reset}`
  );
  return answer === 'yes' || answer === 'y';
}

async function cleanupContainers() {
  log('\n📦 Cleaning up containers...', 'cyan');
  
  const containers = getContainers();
  if (containers.length === 0) {
    log('   No containers to remove', 'blue');
    return 0;
  }

  log(`   Found ${containers.length} container(s)`, 'yellow');
  
  // Stop containers
  log('   Stopping containers...', 'blue');
  containers.forEach(id => {
    try {
      exec(`docker stop ${id}`);
    } catch (_error) {
      // Container already stopped
    }
  });

  // Remove containers
  log('   Removing containers...', 'blue');
  containers.forEach(id => {
    try {
      exec(`docker rm ${id}`);
      log(`   ✅ Removed ${id.substring(0, 12)}`, 'green');
    } catch (error) {
      log(`   ❌ Failed to remove ${id.substring(0, 12)}`, 'red');
    }
  });

  return containers.length;
}

async function cleanupImages(force) {
  log('\n🖼️  Cleaning up images...', 'cyan');
  
  const images = getImages();
  const dangling = getDanglingImages();
  const totalImages = [...new Set([...images, ...dangling])];

  if (totalImages.length === 0) {
    log('   No images to remove', 'blue');
    return 0;
  }

  log(`   Found ${totalImages.length} image(s) (${images.length} project + ${dangling.length} dangling)`, 'yellow');

  if (!force) {
    const confirm = await confirmCleanup('images', totalImages.length);
    if (!confirm) {
      log('   Skipped image cleanup', 'yellow');
      return 0;
    }
  }

  // Remove images
  log('   Removing images...', 'blue');
  totalImages.forEach(id => {
    try {
      exec(`docker rmi -f ${id}`);
      log(`   ✅ Removed ${id.substring(0, 12)}`, 'green');
    } catch (error) {
      log(`   ❌ Failed to remove ${id.substring(0, 12)}`, 'red');
    }
  });

  return totalImages.length;
}

async function cleanupVolumes(force) {
  log('\n💾 Cleaning up volumes...', 'cyan');
  
  const volumes = getVolumes();
  if (volumes.length === 0) {
    log('   No volumes to remove', 'blue');
    return 0;
  }

  log(`   Found ${volumes.length} volume(s)`, 'yellow');
  log('   ⚠️  WARNING: This will delete all persistent data!', 'red');

  if (!force) {
    const confirm = await confirmCleanup('volumes', volumes.length);
    if (!confirm) {
      log('   Skipped volume cleanup', 'yellow');
      return 0;
    }
  }

  // Remove volumes
  log('   Removing volumes...', 'blue');
  volumes.forEach(name => {
    try {
      exec(`docker volume rm ${name}`);
      log(`   ✅ Removed ${name}`, 'green');
    } catch (error) {
      log(`   ❌ Failed to remove ${name}`, 'red');
    }
  });

  return volumes.length;
}

async function cleanupNetworks() {
  log('\n🌐 Cleaning up networks...', 'cyan');
  
  const networks = getNetworks();
  if (networks.length === 0) {
    log('   No networks to remove', 'blue');
    return 0;
  }

  log(`   Found ${networks.length} network(s)`, 'yellow');

  // Remove networks
  log('   Removing networks...', 'blue');
  networks.forEach(id => {
    try {
      exec(`docker network rm ${id}`);
      log(`   ✅ Removed network ${id.substring(0, 12)}`, 'green');
    } catch (error) {
      log(`   ❌ Failed to remove network ${id.substring(0, 12)}`, 'red');
    }
  });

  return networks.length;
}

async function cleanupBuildCache() {
  log('\n🗑️  Cleaning up build cache...', 'cyan');
  
  const cacheInfo = getBuildCache();
  if (!cacheInfo || cacheInfo.includes('0B')) {
    log('   No build cache to remove', 'blue');
    return 0;
  }

  log('   Build cache found:', 'yellow');
  log(`   ${cacheInfo}`, 'blue');

  try {
    execVerbose('docker builder prune -f');
    log('   ✅ Build cache cleared', 'green');
    return 1;
  } catch (error) {
    log('   ❌ Failed to clear build cache', 'red');
    return 0;
  }
}

async function cleanupSystem() {
  log('\n🧹 Running system cleanup...', 'cyan');
  
  try {
    execVerbose('docker system prune -f');
    log('   ✅ System cleanup complete', 'green');
    return true;
  } catch (error) {
    log('   ❌ System cleanup failed', 'red');
    return false;
  }
}

async function generateReport(stats) {
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 CLEANUP REPORT', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const items = [
    { label: 'Containers Removed', count: stats.containers },
    { label: 'Images Removed', count: stats.images },
    { label: 'Volumes Removed', count: stats.volumes },
    { label: 'Networks Removed', count: stats.networks },
    { label: 'Build Cache Cleared', count: stats.buildCache ? 1 : 0 },
    { label: 'System Pruned', count: stats.system ? 1 : 0 }
  ];

  let total = 0;
  items.forEach(item => {
    if (item.count > 0) {
      log(`   ✅ ${item.label}: ${item.count}`, 'green');
      total += item.count;
    } else {
      log(`   ⚪ ${item.label}: 0`, 'blue');
    }
  });

  log('-'.repeat(60), 'cyan');
  log(`   Total items cleaned: ${total}`, 'magenta');
  log('='.repeat(60), 'cyan');
  
  // Disk space reclaimed (estimate)
  log('\n💡 Estimated disk space reclaimed: Check with `docker system df`', 'yellow');
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const includeVolumes = args.includes('--volumes') || args.includes('-v');
  
  log('\n' + '='.repeat(60), 'cyan');
  log('🧹 Docker Clean - Complete Resource Cleanup', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  // Check Docker
  checkDocker();

  const stats = {
    containers: 0,
    images: 0,
    volumes: 0,
    networks: 0,
    buildCache: false,
    system: false
  };

  // Cleanup in order
  stats.containers = await cleanupContainers();
  stats.images = await cleanupImages(force);
  
  if (includeVolumes || force) {
    stats.volumes = await cleanupVolumes(force);
  }
  
  stats.networks = await cleanupNetworks();
  stats.buildCache = await cleanupBuildCache();
  stats.system = await cleanupSystem();

  // Generate report
  await generateReport(stats);

  log('\n✅ Cleanup complete!', 'green');
  log('\nNext steps:', 'cyan');
  log('   1. Rebuild: npm run docker:rebuild', 'blue');
  log('   2. Start fresh: npm run docker:up', 'blue');
  log('   3. Check disk usage: docker system df', 'blue');
  log('');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
