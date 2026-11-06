import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  appType: 'spa',
  plugins: [react()],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tanstack/react-query': path.resolve(__dirname, './src/lib/tanstack-query.tsx'),
      '@tanstack/react-table': path.resolve(__dirname, './src/lib/tanstack-table.tsx'),
      '@tanstack/react-form': path.resolve(__dirname, './src/lib/tanstack-form.tsx'),
      zod: path.resolve(__dirname, './src/lib/zod.ts'),
      'use-debounce': path.resolve(__dirname, './src/lib/use-debounce.ts'),
      'date-fns': path.resolve(__dirname, './src/utils/date.ts'),
      sonner: path.resolve(__dirname, './src/lib/sonner.ts'),
    },
  },
})
