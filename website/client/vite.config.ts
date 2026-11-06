import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tanstack/react-query': path.resolve(__dirname, './src/lib/tanstack-query.tsx'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: ['..', 'C:/Users/USER/.gemini/antigravity/brain'],
    },
  },
})
