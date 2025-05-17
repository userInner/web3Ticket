import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      // This tells esbuild to load .mjs files as JavaScript
      // It's similar in spirit to the webpack rule's 'type: javascript/auto'
      loader: {
        '.mjs': 'jsx', // or 'js' if you don't expect JSX in .mjs from node_modules
      },
    },
  },
})