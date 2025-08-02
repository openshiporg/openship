import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/features': path.resolve(__dirname, './features'),
      '@/app': path.resolve(__dirname, './app'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
    },
  },
})