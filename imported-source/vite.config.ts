import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@shared": path.resolve(__dirname, "."),
      streamdown: path.resolve(__dirname, "lib/streamdown.tsx"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
