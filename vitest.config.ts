import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'forks',
    maxConcurrency: 2,
    fileParallelism: false,
    setupFiles: './tests/setup/setup.ts',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules/**',
      '.opencode/**',
      'tests/e2e/**',
      'e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.ts',
        '**/node_modules/**',
        'tests/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@testing-library/user-event': path.resolve(__dirname, './tests/setup/user-event-mock.ts'),
    },
  },
})
