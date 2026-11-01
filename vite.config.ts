/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], testTimeout: 20_000 },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
