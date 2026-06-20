#!/usr/bin/env node

/**
 * Docker Health Check Script - Multi-service health monitoring
 * 
 * Features:
 * - Checks HTTP health endpoints for all 4 microservices
 * - Validates response format
 * - Shows detailed service info in a table
 * - Continuous monitoring mode
 */

import { execSync } from 'child_process';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

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
  timeout: 5000,
  interval: 3000
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

function checkHttp(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, { timeout: CONFIG.timeout }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: response.statusCode,
            data: jsonData
          });
  } catch (_error) {
          resolve({
            statusCode: response.statusCode,
            data: data
          });
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function getContainerStatus() {
  const workerDir = path.join(__dirname, '..', 'python-worker');
  try {
    const status = exec(`cd "${workerDir}" && docker compose ps`);
    return status.trim();
  } catch (_error) {
    return 'Container not running';
  }
}

async function checkServiceHealth(service) {
  try {
    const response = await checkHttp(service.healthEndpoint);
    
    return {
      service: service,
      healthy: response.statusCode === 200,
      statusCode: response.statusCode,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      service: service,
      healthy: false,
      statusCode: null,
      data: null,
      error: error.message
    };
  }
}

async function checkAllHealth() {
  const results = await Promise.all(SERVICES.map(checkServiceHealth));
  return results;
}

function displayHealthTable(results) {
  log('\n' + '='.repeat(55), 'cyan');
  log('🏥 Microservices Health Check', 'cyan');
  log('='.repeat(55), 'cyan');
  log(`  ${'Service'.padEnd(25)} ${'Port'.padEnd(8)} ${'Status'}`, 'blue');
  log('─'.repeat(55), 'cyan');
  
  let allHealthy = true;
  
  results.forEach(result => {
    if (result.healthy) {
      let statusText = '✅ Healthy';
      if (result.data && result.data.status) {
        statusText = result.data.status === 'healthy' ? '✅ Healthy' : '⚠️ ' + result.data.status;
      }
      log(`  ${result.service.name.padEnd(25)} ${String(result.service.port).padEnd(8)} ${statusText}`, 'green');
    } else {
      allHealthy = false;
      const reason = result.error ? result.error : `HTTP ${result.statusCode || 'No response'}`;
      log(`  ${result.service.name.padEnd(25)} ${String(result.service.port).padEnd(8)} ❌ ${reason}`, 'red');
    }
  });
  
  log('─'.repeat(55), 'cyan');
  log(`  Overall: ${allHealthy ? '✅ All services healthy' : '❌ Some services are down'}`, allHealthy ? 'green' : 'red');
  log('='.repeat(55), 'cyan');
  
  // Show detailed info for embedding-service
  log('\n📊 Detailed Info:', 'blue');
  results.forEach(result => {
    if (result.healthy && result.data) {
      log(`   ${result.service.name}:`, 'magenta');
      log(`      Status: ${result.data.status || 'ok'}`, 'green');
      if (result.data.model_info) {
        log(`      Model: ${result.data.model_info.model_name}`, 'cyan');
        log(`      Dimensions: ${result.data.model_info.dimensions}`, 'cyan');
        log(`      Device: ${result.data.model_info.device}`, 'cyan');
      }
      if (result.data.supabase_connected !== undefined) {
        log(`      Supabase: ${result.data.supabase_connected ? '✅ connected' : '❌ disconnected'}`, 
          result.data.supabase_connected ? 'green' : 'red');
      }
      if (result.data.queue_size !== undefined) {
        log(`      Queue: ${result.data.queue_size}/${result.data.queue_capacity || 100}`, 'cyan');
      }
    }
  });
  
  log('\n📦 Container Status:', 'blue');
  log(`   ${getContainerStatus()}`, 'cyan');
}

async function monitorHealth() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🏥 Continuous Health Monitoring - All Services', 'cyan');
  log('='.repeat(60), 'cyan');
  log('Press Ctrl+C to stop\n', 'yellow');
  
  let checkCount = 0;
  let allHealthyCount = 0;
  
  const interval = setInterval(async () => {
    checkCount++;
    const results = await checkAllHealth();
    const allHealthy = results.every(r => r.healthy);
    
    if (allHealthy) {
      allHealthyCount++;
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const status = allHealthy ? '✅' : '❌';
    const uptime = `${allHealthyCount}/${checkCount}`;
    const healthyServices = results.filter(r => r.healthy).length;
    const totalServices = results.length;
    
    log(`${timestamp} ${status} Check #${checkCount} (${healthyServices}/${totalServices} healthy, All-OK: ${uptime})`, 
      allHealthy ? 'green' : 'red');
    
  }, CONFIG.interval);
  
  process.on('SIGINT', () => {
    clearInterval(interval);
    log('\n\n⚠️  Monitoring stopped', 'yellow');
    log(`Total checks: ${checkCount}, All healthy: ${allHealthyCount}`, 'blue');
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const monitor = args.includes('--monitor') || args.includes('-m');
  
  if (monitor) {
    await monitorHealth();
  } else {
    const results = await checkAllHealth();
    displayHealthTable(results);
    
    // Exit with error code if any unhealthy
    const allHealthy = results.every(r => r.healthy);
    if (!allHealthy) {
      process.exit(1);
    }
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

main();
