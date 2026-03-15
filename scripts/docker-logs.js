#!/usr/bin/env node

/**
 * Docker Logs Script - Real-time container logging
 * 
 * Features:
 * - Streams logs from all containers
 * - Filter by service name
 * - Tail mode (follow logs)
 * - Timestamp display
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  workerDir: path.join(__dirname, '..', 'python-worker'),
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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    follow: args.includes('--follow') || args.includes('-f') || !args.some(a => a.startsWith('-')),
    tail: 100,
    timestamps: args.includes('--timestamps') || args.includes('-t'),
    service: null
  };
  
  // Parse --tail argument
  const tailIndex = args.indexOf('--tail');
  if (tailIndex !== -1 && args[tailIndex + 1]) {
    options.tail = parseInt(args[tailIndex + 1], 10);
  }
  
  // Parse service name
  const serviceIndex = args.indexOf('--service');
  if (serviceIndex !== -1 && args[serviceIndex + 1]) {
    options.service = args[serviceIndex + 1];
  }
  
  return options;
}

function streamLogs() {
  const options = parseArgs();
  
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 Docker Logs - Python Worker Embedding Service', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`📊 Service: ${options.service || 'all'}`, 'blue');
  log(`📝 Tail: last ${options.tail} lines`, 'blue');
  log(`⏱️  Timestamps: ${options.timestamps ? 'enabled' : 'disabled'}`, 'blue');
  log(`🔄 Follow: ${options.follow ? 'yes' : 'no'}`, 'blue');
  log('='.repeat(60) + '\n', 'cyan');
  log('Press Ctrl+C to exit\n', 'yellow');
  
  const args = ['logs'];
  
  if (options.follow) {
    args.push('-f');
  }
  
  args.push(`--tail=${options.tail}`);
  
  if (options.timestamps) {
    args.push('-t');
  }
  
  if (options.service) {
    args.push(options.service);
  }
  
  const dockerProcess = spawn('docker-compose', args, {
    cwd: CONFIG.workerDir,
    stdio: 'inherit'
  });
  
  dockerProcess.on('error', (error) => {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  });
  
  dockerProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      log(`\n⚠️  Process exited with code ${code}`, 'yellow');
    }
  });
}

function showRecentLogs() {
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 Recent Docker Logs', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    const { execSync } = require('child_process');
    const logs = execSync(
      `cd "${CONFIG.workerDir}" && docker-compose logs --tail=50`,
      { encoding: 'utf-8' }
    );
    log(logs, 'reset');
  } catch (error) {
    log('❌ Failed to retrieve logs', 'red');
    log(error.message, 'yellow');
  }
}

function main() {
  const args = process.argv.slice(2);
  
  // If --recent flag, show recent logs and exit
  if (args.includes('--recent') || args.includes('-r')) {
    showRecentLogs();
    return;
  }
  
  // Otherwise, stream logs
  streamLogs();
}

// Handle errors
process.on('uncaughtException', (error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n\n⚠️  Logs streaming stopped', 'yellow');
  process.exit(0);
});

main();
