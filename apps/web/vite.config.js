import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project from /pyApy_Proyecto/.
  // Keep the root path for local development.
  base: process.env.GITHUB_ACTIONS ? "/pyApy_Proyecto/" : "/",
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.API_PROXY || "http://127.0.0.1:4100",
        changeOrigin: false,
      },
    },
  },
  build: { chunkSizeWarningLimit: 700 },
});
