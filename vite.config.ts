import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";



export default defineConfig(({ command }) => {
  const isBuild = command === "build";
  const apiPort = process.env.API_PORT || "3010";

  const plugins = [
    react(),
    tailwindcss(),
    ...(isBuild ? [] : [jsxLocPlugin()]),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      minify: false,
      cssMinify: false,
      reportCompressedSize: false,
    },
    server: {
      port: 3000,
      strictPort: false, // Will find next available port if 3000 is busy
      host: true,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "customer-portal-staging-245f.up.railway.app",
        "customer-portal-production-b032.up.railway.app",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
