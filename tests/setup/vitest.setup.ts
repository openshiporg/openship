import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js modules
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/openship_test'

// Global test utilities
global.testUtils = {
  // Add global test utilities here
}