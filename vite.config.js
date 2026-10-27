import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "https://mp3quran.net",
        changeOrigin: true
      }
    }
  },
  build: {
    target: "es2018",
    sourcemap: false
  }
});
