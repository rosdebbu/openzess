import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import os from 'os'

// Point cacheDir to ~/.openzess/vite-cache to avoid OneDrive permission locks
const customCacheDir = path.join(os.homedir(), '.openzess', 'vite-cache')

export default defineConfig({
  cacheDir: customCacheDir,
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'axios',
      'react-markdown',
      'remark-gfm'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three') || id.includes('@pixiv/three-vrm')) {
              return 'vendor-3d-vrm';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'vendor-markdown';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react-core';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})
