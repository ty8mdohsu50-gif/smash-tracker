import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/smash-tracker/",
  plugins: [react()],
  server: {
    open: true,
    host: true,
  },
});
