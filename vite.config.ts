import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: false,
    middlewareMode: false,
    hmr: {
      protocol: 'ws',
      host: '0.0.0.0',
      port: 5174,
    },
  },
  define: {
    __DEV__: true,
  },
})
