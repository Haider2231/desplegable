import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:5000",
      "/canchas": "http://localhost:5000",
      "/reservas": "http://localhost:5000",
      "/disponibilidades": "http://localhost:5000",
      "/uploads": "http://localhost:5000",
      "/estadisticas": "http://localhost:5000",
      "/test-db": "http://localhost:5000",
      "/pagos": "http://localhost:5000",
      "/facturas": "http://localhost:5000",
      "/establecimientos" :"http://localhost:5000"
    }
  }
});
