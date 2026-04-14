import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    open: true,
    host: true,
  },
  test: {
    // jsdom is required for hook + component tests that touch DOM
    // APIs (matchMedia, localStorage, navigator). Pure utility tests
    // still run fine under it.
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    globals: true,
    setupFiles: ["./src/test/setup.js"],
  },
});
