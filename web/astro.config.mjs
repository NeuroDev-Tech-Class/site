import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://tech.neurodevmentoring.com',
  // The old GitHub Pages site lived under /site/; the new one serves from the root
  base: '/',
  output: 'static',
  integrations: [react()],
  server: { host: true, port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    // Needed for file watching inside Docker on Windows
    server: { watch: { usePolling: true } },
  },
})
