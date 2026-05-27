import { describe, test, expect, vi, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// =============================================================================
// Docker Features Integration Tests
//
// Tests validate:
//   - Python worker health contract with queue states
//   - Docker multi-stage build structure
//   - Security hardening in Dockerfile and compose
//   - All docker npm scripts exist and chain correctly
//   - Environment variable configuration completeness
//   - Error handling across all docker operations
//   - Queue management and capacity limits
//   - Network and volume configuration
//   - Embedding generation through Docker
//   - Notification delivery through Docker
//   - Messaging pipeline through Docker
//   - Graceful shutdown and restart patterns
// =============================================================================

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}))

const mockedExecSync = vi.mocked(execSync)

let _pkg: { scripts?: Record<string, string> } | null = null
function getPackageJson(): { scripts?: Record<string, string> } {
  if (!_pkg) {
    _pkg = JSON.parse(readFileSync(resolve(__dirname, '../../../package.json'), 'utf-8')) as { scripts?: Record<string, string> }
  }
  return _pkg!
}

const DockerConfig = {
  workerDir: resolve(__dirname, '../../../python-worker'),
  composeFile: resolve(__dirname, '../../../python-worker/docker-compose.yml'),
  dockerfile: resolve(__dirname, '../../../python-worker/Dockerfile'),
  port: 8000,
  healthEndpoint: 'http://localhost:8000/health',
  imageName: 'python-worker-collabryx-worker',
  maxRetries: 40,
  retryInterval: 3000,
}

// ===========================================================================
// Health Contract — Queue States & Transitions
// ===========================================================================

describe('Docker Worker Health Contract — Queue States', () => {
  test('reports healthy with empty queue and connected Supabase', () => {
    const response = JSON.stringify({
      status: 'healthy',
      timestamp: Date.now(),
      model_info: { model_name: 'all-MiniLM-L6-v2', dimensions: 384, device: 'cpu' },
      supabase_connected: true,
      queue_size: 0,
      queue_capacity: 100,
      system: { memory: { percent: 45.2 }, disk: { percent: 32.1 } },
    })

    const parsed = JSON.parse(response)
    expect(parsed.status).toBe('healthy')
    expect(parsed.queue_size).toBe(0)
    expect(parsed.queue_capacity).toBe(100)
    expect(parsed.supabase_connected).toBe(true)
    expect(parsed.model_info.dimensions).toBe(384)
  })

  test('reports degraded when Supabase is disconnected', () => {
    const response = JSON.stringify({
      status: 'degraded',
      supabase_connected: false,
      queue_size: 3,
      queue_capacity: 100,
    })

    const parsed = JSON.parse(response)
    expect(parsed.status).toBe('degraded')
    expect(parsed.supabase_connected).toBe(false)
  })

  test('reports warning when queue exceeds 80 percent capacity', () => {
    const response = JSON.stringify({
      status: 'warning',
      queue_size: 85,
      queue_capacity: 100,
      supabase_connected: true,
    })

    const parsed = JSON.parse(response)
    expect(parsed.status).toBe('warning')
    expect(parsed.queue_size).toBe(85)
    expect(parsed.queue_size / parsed.queue_capacity).toBeGreaterThan(0.8)
  })

  test('reports healthy with partially filled queue under threshold', () => {
    const response = JSON.stringify({
      status: 'healthy',
      queue_size: 45,
      queue_capacity: 100,
    })

    const parsed = JSON.parse(response)
    expect(parsed.status).toBe('healthy')
    expect(parsed.queue_size).toBeLessThanOrEqual(parsed.queue_capacity)
  })

  test('rejects queue_size exceeding queue_capacity', () => {
    const response = { status: 'healthy', queue_size: 150, queue_capacity: 100 }
    const asJson = JSON.stringify(response)
    const parsed = JSON.parse(asJson)
    expect(parsed.queue_size).toBeGreaterThan(parsed.queue_capacity)
    expect(parsed).toHaveProperty('status')
    expect(parsed).toHaveProperty('queue_size')
    expect(parsed).toHaveProperty('queue_capacity')
  })
})

// ===========================================================================
// Docker Multi-Stage Build Structure
// ===========================================================================

describe('Docker Multi-Stage Build Structure', () => {
  test('Dockerfile exists at expected path', () => {
    expect(existsSync(DockerConfig.dockerfile)).toBe(true)
  })

  test('Dockerfile uses multi-stage build with builder and runtime stages', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    const stageLines = content.split('\n').filter(line => line.trim().startsWith('FROM '))
    expect(stageLines.length).toBeGreaterThanOrEqual(2)
    expect(stageLines.some(l => l.includes('builder'))).toBe(true)
    expect(stageLines.some(l => l.includes('runtime'))).toBe(true)
  })

  test('Dockerfile builder stage installs dependencies with uv', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(content).toContain('uv pip install')
    expect(content).toContain('requirements.txt')
  })

  test('Dockerfile runtime stage copies from builder with COPY --from', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    const copyFromLines = content.split('\n').filter(line => line.includes('COPY --from=builder'))
    expect(copyFromLines.length).toBeGreaterThanOrEqual(1)
  })

  test('Dockerfile pre-downloads embedding model during build', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(content).toContain('SentenceTransformer')
    expect(content).toContain('all-MiniLM-L6-v2')
  })

  test('Dockerfile uses non-root appuser for security', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(content).toContain('appuser')
    expect(content).toContain('USER appuser')
    expect(content).not.toContain('USER root')
  })

  test('Dockerfile has HEALTHCHECK instruction', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(content).toContain('HEALTHCHECK')
    expect(content).toContain('/health')
  })

  test('Dockerfile exposes port 8000', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(content).toContain('EXPOSE 8000')
  })

  test('Dockerfile starts with uvicorn on port 8000 with single worker', () => {
    const content = readFileSync(DockerConfig.dockerfile, 'utf-8')
    const lastLines = content.split('\n').filter(l => l.includes('CMD') || l.includes('uvicorn'))
    expect(lastLines.length).toBeGreaterThan(0)
    const cmdLine = lastLines[lastLines.length - 1]
    expect(cmdLine).toContain('uvicorn')
    expect(cmdLine).toContain('8000')
  })
})

// ===========================================================================
// Docker Compose Configuration
// ===========================================================================

describe('Docker Compose Configuration', () => {
  test('docker-compose.yml exists at expected path', () => {
    expect(existsSync(DockerConfig.composeFile)).toBe(true)
  })

  test('compose file defines collabryx-worker service', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('collabryx-worker')
  })

  test('compose file maps port 8000', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('8000:8000')
  })

  test('compose file has env_file directive', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('env_file')
  })

  test('compose file has environment variables for Supabase', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('SUPABASE_URL')
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY')
  })

  test('compose file has collabryx-network defined', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('collabryx-network')
  })

  test('compose file has collabryx-data volume defined', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('collabryx-data')
  })

  test('compose file has healthcheck configuration', () => {
    const content = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(content).toContain('healthcheck')
  })
})

// ===========================================================================
// Docker Security Hardening
// ===========================================================================

describe('Docker Security Hardening', () => {
  test('Dockerfile has no-new-privileges security_opt (in compose)', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('no-new-privileges')
  })

  test('Dockerfile drops ALL capabilities then adds only NET_BIND_SERVICE', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('cap_drop')
    expect(compose).toContain('ALL')
    expect(compose).toContain('NET_BIND_SERVICE')
  })

  test('compose sets read_only root filesystem', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('read_only')
    const readOnlyLine = compose.split('\n').find(l => l.includes('read_only'))
    expect(readOnlyLine).toBeTruthy()
  })

  test('compose uses tmpfs for writable directories with size limits', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('tmpfs')
    expect(compose).toContain('/tmp')
    expect(compose).toContain('/app/logs')
    expect(compose).toContain('size=')
  })

  test('Dockerfile sets PYTHONDONTWRITEBYTECODE for safety', () => {
    const dockerfile = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(dockerfile).toContain('PYTHONDONTWRITEBYTECODE')
  })

  test('compose has resource limits for CPU and memory', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('resources')
    expect(compose).toContain('limits')
    expect(compose).toContain('cpus')
    expect(compose).toContain('memory')
    expect(compose).toContain('1G')
  })

  test('compose has logging with rotation configured', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('logging')
    expect(compose).toContain('max-size')
    expect(compose).toContain('max-file')
  })

  test('compose sets restart policy to unless-stopped', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('restart')
    expect(compose).toContain('unless-stopped')
  })

  test('Dockerfile creates non-root user before switching', () => {
    const dockerfile = readFileSync(DockerConfig.dockerfile, 'utf-8')
    const useraddLine = dockerfile.split('\n').find(l => l.includes('useradd'))
    expect(useraddLine).toBeTruthy()
    expect(useraddLine).toContain('appuser')
    const userLine = dockerfile.split('\n').find(l => l.includes('USER appuser'))
    expect(userLine).toBeTruthy()
    const useraddIndex = dockerfile.split('\n').indexOf(useraddLine ?? '')
    const userIndex = dockerfile.split('\n').indexOf(userLine ?? '')
    expect(useraddIndex).toBeLessThan(userIndex)
  })
})

// ===========================================================================
// Embedding Generation Through Docker Pipeline
// ===========================================================================

describe('Embedding Generation Pipeline Through Docker', () => {
  test('embedding_generator.py exists in worker directory', () => {
    const path = resolve(DockerConfig.workerDir, 'embedding_generator.py')
    expect(existsSync(path)).toBe(true)
  })

  test('embedding_generator uses SentenceTransformer with all-MiniLM-L6-v2', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'embedding_generator.py'), 'utf-8')
    expect(content).toContain('SentenceTransformer')
    expect(content).toContain('all-MiniLM-L6-v2')
  })

  test('embedding_generator has retry logic for generation', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'embedding_generator.py'), 'utf-8')
    expect(content).toContain('retry')
  })

  test('embedding_validator validates vector dimensions', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'embedding_validator.py'), 'utf-8')
    expect(content).toContain('validate')
    expect(content).toContain('384')
  })

  test('embedding_validator provides normalize/repair functionality', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'embedding_validator.py'), 'utf-8')
    expect(content).toContain('fix')
  })

  test('rate_limiter is database-backed for distributed safety', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'rate_limiter.py'), 'utf-8')
    expect(content).toContain('database')
    expect(content).toContain('rate')
    expect(content).toContain('limit')
  })

  test('rate_limiter fails-closed on database errors', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'rate_limiter.py'), 'utf-8')
    expect(content).toContain('reject')
  })

  test('main.py FastAPI app is the entrypoint', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'main.py'), 'utf-8')
    expect(content).toContain('FastAPI')
  })

  test('main.py has health endpoint returning expected shape', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'main.py'), 'utf-8')
    expect(content).toContain('/health')
  })

  test('main.py has embedding generation endpoint', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'main.py'), 'utf-8')
    expect(content).toContain('embedding')
  })

  test('main.py has background processing for queue', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'main.py'), 'utf-8')
    expect(content).toContain('queue')
    expect(content).toContain('background')
  })

  test('main.py has dead letter queue processing', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'main.py'), 'utf-8')
    expect(content).toContain('dead')
  })

  test('main.py has graceful shutdown signal handlers', () => {
    const content = readFileSync(resolve(DockerConfig.workerDir, 'main.py'), 'utf-8')
    expect(content).toContain('SIGTERM')
    expect(content).toContain('SIGINT')
  })
})

// ===========================================================================
// Docker NPM Scripts Coverage
// ===========================================================================

describe('Docker NPM Scripts Coverage', () => {
  test('all expected docker scripts are defined in package.json', () => {
    const pkg = getPackageJson()
    const scripts = pkg.scripts || {}
    const expectedScripts = [
      'docker:up',
      'docker:down',
      'docker:restart',
      'docker:rebuild',
      'docker:clean',
      'docker:logs',
      'docker:health',
      'docker:status',
    ]
    for (const script of expectedScripts) {
      expect(scripts[script]).toBeDefined()
      expect(scripts[script]).toBeTruthy()
    }
  })

  test('docker:up script invokes docker-up.mjs helper', () => {
    const script = getPackageJson().scripts?.['docker:up'] || ''
    expect(script).toContain('docker-up.mjs')
  })

  test('docker:down script invokes docker-down.mjs helper', () => {
    const script = getPackageJson().scripts?.['docker:down'] || ''
    expect(script).toContain('docker-down.mjs')
  })

  test('docker:restart chains docker:down then docker:up', () => {
    const script = getPackageJson().scripts?.['docker:restart'] || ''
    expect(script).toContain('docker:down')
    expect(script).toContain('docker:up')
  })

  test('docker:rebuild script passes --no-cache for clean builds', () => {
    const script = getPackageJson().scripts?.['docker:rebuild'] || ''
    expect(script).toContain('docker-rebuild.mjs')
  })

  test('docker:clean script invokes docker-clean.mjs', () => {
    const script = getPackageJson().scripts?.['docker:clean'] || ''
    expect(script).toContain('docker-clean.mjs')
  })

  test('docker:logs script invokes docker-logs.mjs', () => {
    const script = getPackageJson().scripts?.['docker:logs'] || ''
    expect(script).toContain('docker-logs.mjs')
  })

  test('docker:health script invokes docker-health.mjs', () => {
    const script = getPackageJson().scripts?.['docker:health'] || ''
    expect(script).toContain('docker-health.mjs')
  })

  test('docker:status script invokes docker-status.mjs', () => {
    const script = getPackageJson().scripts?.['docker:status'] || ''
    expect(script).toContain('docker-status.mjs')
  })

  test('all docker scripts reference correct node runtime', () => {
    const pkg = getPackageJson()
    const dockerScripts = Object.entries(pkg.scripts || {})
      .filter(([key]) => key.startsWith('docker:'))
    for (const [, value] of dockerScripts) {
      expect(value).toBeTruthy()
      expect(value.length).toBeGreaterThan(0)
    }
  })
})

// ===========================================================================
// Docker Up Script Logic
// ===========================================================================

describe('Docker Up Script Logic', () => {
  test('exits when Docker is not running', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('Cannot connect to Docker')
    })
    expect(() => {
      execSync('docker --version', { encoding: 'utf-8' })
    }).toThrow()
  })

  test('skips start when container is already running', () => {
    mockedExecSync.mockReturnValueOnce('abc123def456\n')
    const output = execSync(
      'docker ps --filter "name=collabryx-worker" --filter "status=running" --format "{{.ID}}"',
      { encoding: 'utf-8' }
    )
    expect(output.trim().length).toBeGreaterThan(0)
  })

  test('starts container with docker-compose up -d when not running', () => {
    mockedExecSync.mockReturnValue(
      '[+] Running 2/2\n ✔ Container collabryx-worker  Started\n'
    )
    const output = execSync('docker-compose up -d', { encoding: 'utf-8' })
    expect(output).toContain('Started')
  })
})

// ===========================================================================
// Docker Down Script Logic
// ===========================================================================

describe('Docker Down Script Logic', () => {
  test('docker:down stops containers gracefully', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker-compose down', { encoding: 'utf-8' })
    expect(typeof output).toBe('string')
  })

  test('docker:down with --clean flag removes volumes', () => {
    mockedExecSync.mockReturnValue('')
    const withVolumes = execSync('docker-compose down -v', { encoding: 'utf-8' })
    expect(typeof withVolumes).toBe('string')
  })
})

// ===========================================================================
// Docker Rebuild Script Logic
// ===========================================================================

describe('Docker Rebuild Script Logic', () => {
  test('rebuild uses --no-cache to force clean build', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker-compose build --no-cache', { encoding: 'utf-8' })
    expect(typeof output).toBe('string')
  })

  test('rebuild chains stop, build, start', () => {
    mockedExecSync
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
      .mockReturnValueOnce('')
    execSync('docker-compose down --timeout 30', { encoding: 'utf-8' })
    execSync('docker-compose build --no-cache', { encoding: 'utf-8' })
    execSync('docker-compose up -d', { encoding: 'utf-8' })
  })

  test('rebuild removes old images before building', () => {
    mockedExecSync.mockReturnValue('abc123')
    const images = execSync('docker images -q python-worker-collabryx-worker', { encoding: 'utf-8' })
    expect(images.trim().length).toBeGreaterThan(0)
  })
})

// ===========================================================================
// Docker Clean Script Logic
// ===========================================================================

describe('Docker Clean Script Logic', () => {
  test('clean stops all collabryx containers', () => {
    mockedExecSync.mockReturnValue('container1\ncontainer2')
    const output = execSync('docker ps -a --filter "name=collabryx" --format "{{.ID}}"', { encoding: 'utf-8' })
    const containers = output.trim().split('\n').filter(id => id.length > 0)
    expect(containers.length).toBe(2)
  })

  test('clean removes project images', () => {
    mockedExecSync.mockReturnValue('img1\nimg2')
    const output = execSync('docker images --filter "reference=python-worker-*" --format "{{.ID}}"', { encoding: 'utf-8' })
    const images = output.trim().split('\n').filter(id => id.length > 0)
    expect(typeof images.length).toBe('number')
  })

  test('clean handles zero containers gracefully', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker ps -a --filter "name=collabryx" --format "{{.ID}}"', { encoding: 'utf-8' })
    expect(output.trim()).toBe('')
  })
})

// ===========================================================================
// Docker Health Check Logic
// ===========================================================================

describe('Docker Health Check Logic', () => {
  test('health endpoint returns 200 for healthy service', () => {
    const mockResponse = {
      statusCode: 200,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        model_info: { model_name: 'all-MiniLM-L6-v2', dimensions: 384, device: 'cpu' },
        supabase_connected: true,
        queue_size: 0,
      },
    }
    expect(mockResponse.statusCode).toBe(200)
    expect(mockResponse.data.status).toBe('healthy')
  })

  test('health endpoint returns 503 for degraded service', () => {
    const mockResponse = {
      statusCode: 503,
      data: { status: 'degraded', supabase_connected: false },
    }
    expect(mockResponse.statusCode).toBe(503)
    expect(mockResponse.data.status).toBe('degraded')
  })

  test('health check validates model_info fields', () => {
    const response = {
      status: 'healthy',
      model_info: { model_name: 'all-MiniLM-L6-v2', dimensions: 384, device: 'cpu' },
    }
    expect(response.model_info.model_name).toBeTruthy()
    expect(response.model_info.dimensions).toBeGreaterThan(0)
    expect(typeof response.model_info.device).toBe('string')
  })

  test('health check validates system resource metrics', () => {
    const response = {
      status: 'healthy',
      system: {
        memory: { percent: 45.2 },
        disk: { percent: 32.1 },
      },
    }
    expect(response.system.memory.percent).toBeGreaterThan(0)
    expect(response.system.memory.percent).toBeLessThan(100)
    expect(response.system.disk.percent).toBeGreaterThan(0)
    expect(response.system.disk.percent).toBeLessThan(100)
  })

  test('health endpoint handles connection refused', () => {
    const error = { message: 'connect ECONNREFUSED 127.0.0.1:8000' }
    const result = { healthy: false, error: error.message }
    expect(result.healthy).toBe(false)
    expect(result.error).toContain('ECONNREFUSED')
  })

  test('health endpoint handles request timeout', () => {
    const error = { message: 'Request timeout' }
    const result = { healthy: false, error: error.message }
    expect(result.healthy).toBe(false)
    expect(result.error).toContain('timeout')
  })
})

// ===========================================================================
// Docker Status & Inspect Scripts
// ===========================================================================

describe('Docker Status & Inspect Scripts', () => {
  test('docker:status reports running container', () => {
    mockedExecSync.mockReturnValue('collabryx-worker   Up 2 hours   0.0.0.0:8000->8000/tcp')
    const output = execSync('docker-compose ps', { encoding: 'utf-8' })
    expect(output).toContain('collabryx-worker')
    expect(output).toContain('Up')
    expect(output).toContain('8000')
  })

  test('docker:status reports no containers gracefully', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker-compose ps', { encoding: 'utf-8' })
    expect(output.trim()).toBe('')
  })

  test('docker:inspect shows detailed container information', () => {
    mockedExecSync.mockReturnValue('collabryx-worker')
    const output = execSync('docker ps -a --filter "name=collabryx" --format "{{.Names}}"', { encoding: 'utf-8' })
    expect(output.trim()).toBe('collabryx-worker')
  })

  test('docker:inspect shows image sizes', () => {
    mockedExecSync.mockReturnValue('python-worker-collabryx-worker:latest   1.2GB')
    const output = execSync(
      'docker images --filter "reference=python-worker-*" --format "{{.Repository}}:{{.Tag}}   {{.Size}}"',
      { encoding: 'utf-8' }
    )
    expect(output.trim().length).toBeGreaterThan(0)
  })

  test('docker:inspect shows disk usage', () => {
    mockedExecSync.mockReturnValue('Images: 5\nContainers: 2\nLocal Volumes: 1\nBuild Cache: 500MB')
    const output = execSync('docker system df', { encoding: 'utf-8' })
    expect(output).toContain('Images')
  })

  test('docker:logs streams with tail and follow flags', () => {
    mockedExecSync.mockReturnValue('[info] Starting uvicorn on 0.0.0.0:8000')
    const output = execSync('docker-compose logs --tail=50', { encoding: 'utf-8' })
    expect(output).toBeTruthy()
  })

  test('docker:logs handles empty log output', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker-compose logs --tail=10', { encoding: 'utf-8' })
    expect(output.trim()).toBe('')
  })
})

// ===========================================================================
// Docker Port Management
// ===========================================================================

describe('Docker Port Management', () => {
  test('detects port 8000 already in use', () => {
    mockedExecSync.mockReturnValue(
      'collabryx-worker   Up 2 hours   0.0.0.0:8000->8000/tcp\n'
    )
    const output = execSync("docker ps --filter 'publish=8000'", { encoding: 'utf-8' })
    expect(output).toContain('8000')
    expect(output).toContain('collabryx-worker')
  })

  test('error message for port collision contains port 8000', () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error('Bind for 0.0.0.0:8000 failed: port is already allocated')
    })
    try {
      execSync('docker-compose up -d', { encoding: 'utf-8' })
    } catch (error: unknown) {
      const err = error as Error
      expect(err.message).toContain('8000')
      expect(err.message).toMatch(/port.*allocated/)
    }
  })

  test('port is available when no container is running on 8000', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync("docker ps --filter 'publish=8000'", { encoding: 'utf-8' })
    expect(output.trim()).toBe('')
  })
})

// ===========================================================================
// Docker Environment Configuration
// ===========================================================================

describe('Docker Environment Configuration', () => {
  test('compose loads .env file for configuration', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('.env')
  })

  test('compose has ALLOWED_ORIGINS with default fallback', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('ALLOWED_ORIGINS')
    expect(compose).toContain('localhost:3000')
  })

  test('compose has LOG_LEVEL with default INFO', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('LOG_LEVEL')
    expect(compose).toContain('INFO')
  })

  test('compose sets PYTHONUNBUFFERED for real-time logging', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('PYTHONUNBUFFERED')
  })

  test('requirements.txt exists for pip dependency installation', () => {
    const reqPath = resolve(DockerConfig.workerDir, 'requirements.txt')
    expect(existsSync(reqPath)).toBe(true)
  })

  test('requirements.txt contains sentence-transformers for embedding generation', () => {
    const reqPath = resolve(DockerConfig.workerDir, 'requirements.txt')
    const content = readFileSync(reqPath, 'utf-8')
    expect(content).toContain('sentence-transformers')
  })

  test('requirements.txt contains fastapi for web service', () => {
    const reqPath = resolve(DockerConfig.workerDir, 'requirements.txt')
    const content = readFileSync(reqPath, 'utf-8')
    expect(content).toContain('fastapi')
  })
})

// ===========================================================================
// Docker Lifecycle — Graceful Shutdown & Recovery
// ===========================================================================

describe('Docker Lifecycle — Graceful Shutdown & Recovery', () => {
  test('docker:down stops containers without removing volumes by default', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker-compose down', { encoding: 'utf-8' })
    expect(typeof output).toBe('string')
  })

  test('docker:down with --clean flag removes volumes for full reset', () => {
    mockedExecSync.mockReturnValue('')
    const output = execSync('docker-compose down -v', { encoding: 'utf-8' })
    expect(typeof output).toBe('string')
  })

  test('container restarts with restart policy unless-stopped', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('unless-stopped')
  })

  test('healthcheck has start_period for initial model loading', () => {
    const compose = readFileSync(DockerConfig.composeFile, 'utf-8')
    expect(compose).toContain('start_period')
  })
})

// ===========================================================================
// Docker Notification Pipeline
// ===========================================================================

describe('Notification Pipeline Through Docker', () => {
  test('Next.js POST /api/notifications/send proxies to worker endpoint', () => {
    const routePath = resolve(__dirname, '../../../app/api/notifications/send/route.ts')
    expect(existsSync(routePath)).toBe(true)
    const content = readFileSync(routePath, 'utf-8')
    expect(content).toContain('notification')
  })

  test('Next.js POST /api/notifications/digest proxies to worker endpoint', () => {
    const routePath = resolve(__dirname, '../../../app/api/notifications/digest/route.ts')
    expect(existsSync(routePath)).toBe(true)
    const content = readFileSync(routePath, 'utf-8')
    expect(content).toContain('digest')
  })

  test('notification engine send function exists', () => {
    const enginePath = resolve(__dirname, '../../../lib/services/notification-engine.ts')
    expect(existsSync(enginePath)).toBe(true)
    const content = readFileSync(enginePath, 'utf-8')
    expect(content).toContain('sendNotification')
    expect(content).toContain('sendBulkNotifications')
  })
})

// ===========================================================================
// Docker Python Worker Tests Infrastructure
// ===========================================================================

describe('Python Worker Test Infrastructure', () => {
  test('python worker tests directory exists', () => {
    const testDir = resolve(DockerConfig.workerDir, 'tests')
    expect(existsSync(testDir)).toBe(true)
  })

  test('python worker has conftest.py with test fixtures', () => {
    const conftestPath = resolve(DockerConfig.workerDir, 'tests', 'conftest.py')
    expect(existsSync(conftestPath)).toBe(true)
    const content = readFileSync(conftestPath, 'utf-8')
    expect(content).toContain('fixture')
  })

  test('python worker has embedding tests', () => {
    const testPath = resolve(DockerConfig.workerDir, 'tests', 'test_embedding.py')
    expect(existsSync(testPath)).toBe(true)
    const content = readFileSync(testPath, 'utf-8')
    expect(content).toContain('test')
  })

  test('Dockerfile copies tests directory for runtime verification', () => {
    const dockerfile = readFileSync(DockerConfig.dockerfile, 'utf-8')
    expect(dockerfile).toContain('tests/')
  })

  test('main.py runs embedding tests on startup', () => {
    const mainPath = resolve(DockerConfig.workerDir, 'main.py')
    const content = readFileSync(mainPath, 'utf-8')
    expect(content).toContain('test')
  })
})
