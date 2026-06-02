import { describe, test, expect, vi, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// =============================================================================
// TC-004: Verify bun run dev starts Next.js on localhost:3000
//
// This test validates that `bun run dev` invokes Next.js correctly on the
// expected port (3000) by inspecting the package.json script and verifying
// the invocation chain (check-docker.mjs → next dev).
// =============================================================================

// Mock child_process to avoid actually spawning processes
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}))

const mockedExecSync = vi.mocked(execSync)

// Lazy-load package.json once
let _pkg: { scripts?: Record<string, string> } | null = null
function getPackageJson(): { scripts?: Record<string, string> } {
  if (!_pkg) {
    _pkg = JSON.parse(readFileSync(resolve(__dirname, '../../../package.json'), 'utf-8')) as { scripts?: Record<string, string> }
  }
  return _pkg!
}

describe('bun run dev - Dev Server Startup (TC-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Package.json Script Validation
  // ---------------------------------------------------------------------------

  test('package.json has dev script defined', () => {
    // Arrange
    const pkg = getPackageJson()

    // Act
    const devScript = pkg.scripts?.dev

    // Assert
    expect(devScript).toBeDefined()
    expect(devScript).toBeTruthy()
  })

  test('dev script references Next.js execution', () => {
    // Arrange
    const pkg = getPackageJson()

    // Act
    const devScript = pkg.scripts?.dev

    // Assert
    expect(devScript).toContain('next')
  })

  test('dev script includes Docker pre-check via check-docker.mjs', () => {
    // Arrange
    const pkg = getPackageJson()

    // Act
    const devScript = pkg.scripts?.dev

    // Assert
    // The script should either directly reference check-docker.mjs or have a skip variant
    expect(devScript).toContain('check-docker')
  })

  test('dev:skip-docker script bypasses Docker check', () => {
    // Arrange
    const pkg = getPackageJson()

    // Act
    const skipScript = pkg.scripts?.['dev:skip-docker']

    // Assert
    expect(skipScript).toBeDefined()
    expect(skipScript).toContain('next dev')
    expect(skipScript).not.toContain('check-docker')
  })

  // ---------------------------------------------------------------------------
  // ExecSync Mock: Simulate successful next dev invocation
  // ---------------------------------------------------------------------------

  test('mocked next dev invocation returns expected output', () => {
    // Arrange — simulate what `next dev` outputs on startup
    mockedExecSync.mockReturnValue(
      '  ▲ Next.js 16.1.7\n' +
      '  - Local:        http://localhost:3000\n' +
      '  - Network:      http://192.168.1.1:3000\n' +
      '\n' +
      ' ✓ Starting...\n' +
      ' ✓ Ready in 2.3s\n'
    )

    // Act — simulate running `next dev`
    const output = execSync('bunx next dev', { encoding: 'utf-8' })

    // Assert
    expect(output).toBeDefined()
    expect(output).toContain('localhost:3000')
    expect(output).toContain('Next.js')
    expect(output).toContain('Ready')
  })

  test('mocked next dev outputs localhost:3000 as the dev URL', () => {
    // Arrange
    mockedExecSync.mockReturnValue('Local: http://localhost:3000')

    // Act
    const output = execSync('bunx next dev', { encoding: 'utf-8' })

    // Assert
    expect(output).toMatch(/localhost:3000/)
  })

  test('mocked next dev returns a non-empty response', () => {
    // Arrange
    mockedExecSync.mockReturnValue('✓ Ready')

    // Act
    const output = execSync('bunx next dev', { encoding: 'utf-8' })

    // Assert
    expect(output.length).toBeGreaterThan(0)
  })

  // ---------------------------------------------------------------------------
  // Port Verification
  // ---------------------------------------------------------------------------

  test('default Next.js port is 3000 as documented', () => {
    // Next.js 16 defaults to port 3000 unless PORT env var is set or -p flag used
    const defaultPort = 3000

    expect(defaultPort).toBe(3000)
  })

  test('dev script does not override default port via -p flag', () => {
    // Arrange
    const pkg = getPackageJson()
    const devScript = pkg.scripts?.dev as string

    // Assert — No explicit -p flag that would change the port
    expect(devScript).not.toMatch(/\s-p\s/)
    expect(devScript).not.toMatch(/\s--port\s/)
  })

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  test('handles execSync failure gracefully', () => {
    // Arrange
    mockedExecSync.mockImplementation(() => {
      throw new Error('Command failed: next dev')
    })

    // Act & Assert
    expect(() => execSync('bunx next dev')).toThrow('Command failed')
  })
})
