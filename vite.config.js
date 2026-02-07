import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                create: resolve(__dirname, 'create.html'),
            },
        },
    },
    server: {
        host: true, // Listen on all local IPs
        port: 5173,
        strictPort: true, // Fail if port is already in use
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
