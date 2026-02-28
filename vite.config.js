import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/ss-api': 'http://localhost:3001',
      '/covers': 'http://localhost:3001',
    },
  },
})
