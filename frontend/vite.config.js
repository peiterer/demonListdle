import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/new-game': {
        target: 'http://backend:5000',
        changeOrigin: true,
      },
      '/suggestions': {
        target: 'http://backend:5000',
        changeOrigin: true,
      },
      '/guess': {
        target: 'http://backend:5000',
        changeOrigin: true,
      },
    },
  },
})
