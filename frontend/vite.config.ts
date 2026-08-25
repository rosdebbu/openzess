import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Web-only build. The Electron desktop shell lives in ./desktop-legacy
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})

