import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", port: 3000, strictPort: false },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: [
      "localhost",
      "customer-portal-production-b032.up.railway.app",
    ],
  },
});
