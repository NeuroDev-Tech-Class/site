/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config'

// Unit and component tests; the built-site checks live in vitest.build.config.ts
export default getViteConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
