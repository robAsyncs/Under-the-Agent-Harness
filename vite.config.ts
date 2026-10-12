import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from https://robasyncs.github.io/Agent/, so builds (and previews of them) live under /Agent/.
  base: command === 'build' || isPreview ? '/Agent/' : '/',
}))
