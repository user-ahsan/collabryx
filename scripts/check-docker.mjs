#!/usr/bin/env node

/**
 * Pre-dev Docker backend check
 * Runs before `bun run dev` when BACKEND_MODE=auto or 'docker'
 */

import { stdout, stderr } from 'process'

const DOCKER_URL = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
const HEALTH_ENDPOINT = `${DOCKER_URL}/health`
const TIMEOUT_MS = 3000

async function checkHealth() {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    fetch(HEALTH_ENDPOINT, {
      signal: controller.signal,
      method: 'GET',
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId)
        resolve(data.status === 'healthy')
      })
      .catch(() => {
        clearTimeout(timeoutId)
        resolve(false)
      })
  })
}

async function main() {
  // Skip check if running on Vercel
  if (process.env.VERCEL) {
    stdout.write('✅ Vercel deployment: Using Render backend\n')
    return
  }
  
  stdout.write('🔍 Checking Docker backend health...\n')
  
  const isHealthy = await checkHealth()
  
  if (isHealthy) {
    stdout.write('✅ Docker backend is healthy at ' + DOCKER_URL + '\n')
    stdout.write('🚀 Starting Next.js dev server...\n')
  } else {
    stderr.write('\n')
    stderr.write('⚠️  ┌─────────────────────────────────────────────────────────┐\n')
    stderr.write('⚠️  │  Docker backend not responding                          │\n')
    stderr.write('⚠️  └─────────────────────────────────────────────────────────┘\n')
    stderr.write('\n')
    stderr.write('📍 Backend URL: ' + DOCKER_URL + '\n')
    stderr.write('\n')
    stderr.write('🔧 Quick fix:\n')
    stderr.write('   1. Start Docker backend:\n')
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
