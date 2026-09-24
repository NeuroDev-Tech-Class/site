import { defineConfig } from 'vitest/config'

// Checks on the output of `npm run build`
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
