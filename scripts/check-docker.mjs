#!/usr/bin/env node

/**
 * Pre-dev Docker backend check - All 4 microservices
 * Runs before `bun run dev` when BACKEND_MODE=auto or 'docker'
 */

import { stdout, stderr } from 'process'

const TIMEOUT_MS = 3000

const SERVICES = [
  { name: 'embedding-service',    port: 8000, url: 'http://localhost:8000' },
  { name: 'notification-service', port: 8002, url: 'http://localhost:8002' },
  { name: 'feed-service',         port: 8003, url: 'http://localhost:8003' },
  { name: 'match-service',        port: 8004, url: 'http://localhost:8004' }
]

async function checkServiceHealth(service) {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    fetch(`${service.url}/health`, {
      signal: controller.signal,
      method: 'GET',
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId)
        resolve({ service, healthy: data.status === 'healthy' })
      })
      .catch(() => {
        clearTimeout(timeoutId)
        resolve({ service, healthy: false })
      })
  })
}

async function main() {
  // Skip check if running on Vercel
  if (process.env.VERCEL) {
    stdout.write('✅ Vercel deployment: Using Render backend\n')
    return
  }
  
  stdout.write('🔍 Checking Docker microservices health...\n')
  
  const results = await Promise.all(SERVICES.map(checkServiceHealth))
  const allHealthy = results.every(r => r.healthy)
  const healthyCount = results.filter(r => r.healthy).length
  const totalCount = results.length
  
  if (allHealthy) {
    stdout.write(`✅ All ${totalCount} microservices are healthy\n`)
    results.forEach(r => {
      stdout.write(`   ${r.service.name.padEnd(22)} ✅ Healthy (port ${r.service.port})\n`)
    })
    stdout.write('🚀 Starting Next.js dev server...\n')
  } else {
    stderr.write('\n')
    stderr.write('⚠️  ┌─────────────────────────────────────────────────────────┐\n')
    stderr.write(`⚠️  │  ${healthyCount}/${totalCount} microservices responding                           │\n`)
    stderr.write('⚠️  └─────────────────────────────────────────────────────────┘\n')
    stderr.write('\n')
    
    results.forEach(r => {
      if (r.healthy) {
        stdout.write(`   ${r.service.name.padEnd(22)} ✅ Healthy (port ${r.service.port})\n`)
      } else {
        stderr.write(`   ${r.service.name.padEnd(22)} ❌ Not responding (port ${r.service.port})\n`)
      }
    })
    
    stderr.write('\n')
    stderr.write('🔧 Quick fix:\n')
    stderr.write('   1. Start Docker microservices:\n')
    stderr.write('      bun run docker:up\n')
    stderr.write('\n')
    stderr.write('   2. Or skip Docker check:\n')
    stderr.write('      bun run dev:skip-docker\n')
    stderr.write('\n')
    // Don't block dev server startup, just warn
    stdout.write('⚠️  Continuing anyway...\n')
  }
}

main().catch((err) => {
  stderr.write('Error in Docker check: ' + err.message + '\n')
  process.exit(1)
})
