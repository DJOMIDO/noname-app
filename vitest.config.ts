import path from 'node:path'
import { defineConfig } from 'vitest/config'

// The first test batch covers pure logic modules only, so Node is enough —
// no Vue/Tailwind plugins and no jsdom. Component tests, if ever needed,
// should come with their own environment config rather than this default.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
