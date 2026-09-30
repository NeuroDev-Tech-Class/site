/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

// Unit and component tests; the built-site checks live in vitest.build.config.ts
export default getViteConfig({
  // Its own dependency cache: sharing the dev server's breaks a running `astro dev` (_jsxDEV is not a function)
  cacheDir: 'node_modules/.vite-test',
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // A worker per core swamps the Windows bind mount while files first compile, and first tests time out
    maxWorkers: 6,
  },
})
