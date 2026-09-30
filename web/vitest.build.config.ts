import { defineConfig } from 'vitest/config'

// Checks on the output of `npm run build`
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Some checks read every built file through the Windows bind mount, and grow with the site
    testTimeout: 30_000,
  },
})
