#!/usr/bin/env node

/**
 * Docker Health Check Script - Service health monitoring
 * 
 * Features:
 * - Checks HTTP health endpoint
 * - Validates response format
 * - Shows detailed service info
 * - Continuous monitoring mode
 */

const { execSync } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  healthEndpoint: 'http://localhost:8000/health',
  timeout: 5000,
  interval: 3000,
  serviceName: 'embedding-service'
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
        } catch (error) {
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
    const status = exec(`cd "${workerDir}" && docker-compose ps`);
    return status.trim();
  } catch (error) {
    return 'Container not running';
  }
}

async function checkHealth() {
  try {
    const response = await checkHttp(CONFIG.healthEndpoint);
    
    if (response.statusCode === 200) {
      return {
        healthy: true,
        statusCode: response.statusCode,
        data: response.data
      };
    } else {
      return {
        healthy: false,
        statusCode: response.statusCode,
        data: response.data
      };
    }
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}

function displayHealth(result) {
  log('\n' + '='.repeat(60), 'cyan');
  log('🏥 Docker Health Check - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  if (result.healthy) {
    log('✅ Status: HEALTHY', 'green');
  } else {
    log('❌ Status: UNHEALTHY', 'red');
  }
  
  log('\n📊 Response Details:', 'blue');
  
  if (result.error) {
    log(`   Error: ${result.error}`, 'red');
  } else {
    log(`   HTTP Code: ${result.statusCode}`, result.healthy ? 'green' : 'red');
    
    if (result.data) {
      log(`   Service: ${result.data.status || 'unknown'}`, result.healthy ? 'green' : 'yellow');
      
      if (result.data.model_info) {
        log(`   Model: ${result.data.model_info.model_name}`, 'cyan');
        log(`   Dimensions: ${result.data.model_info.dimensions}`, 'cyan');
        log(`   Device: ${result.data.model_info.device}`, 'cyan');
      }
      
      if (result.data.supabase_connected !== undefined) {
        log(`   Supabase: ${result.data.supabase_connected ? 'connected' : 'disconnected'}`, 
          result.data.supabase_connected ? 'green' : 'red');
      }
      
      if (result.data.queue_size !== undefined) {
        log(`   Queue Size: ${result.data.queue_size}`, 'cyan');
      }
      
      if (result.data.queue_capacity !== undefined) {
        log(`   Queue Capacity: ${result.data.queue_capacity}`, 'cyan');
      }
    }
  }
  
  log('\n📦 Container Status:', 'blue');
  log(`   ${getContainerStatus()}`, 'cyan');
  
  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

async function monitorHealth() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🏥 Continuous Health Monitoring', 'cyan');
  log('='.repeat(60), 'cyan');
  log('Press Ctrl+C to stop\n', 'yellow');
  
  let checkCount = 0;
  let healthyCount = 0;
  
  const interval = setInterval(async () => {
    checkCount++;
    const result = await checkHealth();
    
    if (result.healthy) {
      healthyCount++;
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const status = result.healthy ? '✅' : '❌';
    const uptime = `${healthyCount}/${checkCount}`;
    
    log(`${timestamp} ${status} Health check #${checkCount} (Success: ${uptime})`, 
      result.healthy ? 'green' : 'red');
    
  }, CONFIG.interval);
  
  process.on('SIGINT', () => {
    clearInterval(interval);
    log('\n\n⚠️  Monitoring stopped', 'yellow');
    log(`Total checks: ${checkCount}, Successful: ${healthyCount}`, 'blue');
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const monitor = args.includes('--monitor') || args.includes('-m');
  
  if (monitor) {
    await monitorHealth();
  } else {
    const result = await checkHealth();
    displayHealth(result);
    
    // Exit with error code if unhealthy
    if (!result.healthy) {
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
