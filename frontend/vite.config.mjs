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
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
})
