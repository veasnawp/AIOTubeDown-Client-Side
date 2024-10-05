import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 49007,
    proxy: {
      "/main_window": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/webview.js": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/checking_server": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/assets": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/static": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/aio-dlp": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/download.php": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/img/payment-qr": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/ct-image": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/goto": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/auth": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
      "/api": {
        target: `http://localhost:${49007+1}`,
        changeOrigin: true,
      },
    }
  }
})
