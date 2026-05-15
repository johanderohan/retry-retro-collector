import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const target = process.env.VITE_API_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api':    target,
      '/ss-api': target,
      '/covers': target,
      '/logos':  target,
    },
  },
})
