import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const kasaneTarget = env.VITE_KASANE_API_BASE_URL || "http://localhost:5173";

  return {
    plugins: [react()],
    base: "/Madori/",

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
      port: 1420,
      strictPort: true,
      host: host || false,
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 1421,
          }
        : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
      proxy: {
        "/kasane": {
          target: kasaneTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/kasane/, ""),
        },
      },
    },
  };
});
