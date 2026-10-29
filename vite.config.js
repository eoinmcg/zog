import { defineConfig } from 'vite'

export default defineConfig({
  base: '',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'game.js',
        chunkFileNames: 'game.js',
        assetFileNames: 'game-[name].[ext]',
        manualChunks: undefined
      }
    }
  },
  define: {
    BUILD_DATE: JSON.stringify(new Date().toISOString()),
  },
})
