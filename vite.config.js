import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  appType: "mpa",
  build: {
    emptyOutDir: true,
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, '/index.html'),
        feed: resolve(__dirname, '/feed/index.html'),
      },
    },
  },
  publicDir: '../public',
  resolve: {
    alias: {
      "@scripts": resolve(__dirname, "src/scripts"),
    },
  },
  root: "./src",
})
