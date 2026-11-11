import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Mtandaoni (GitHub Pages) tumia jina la repo, kwenye kompyuta yako (npm run dev) tumia "/"
  base: command === 'build' ? '/talent-flex-/' : '/',
}))