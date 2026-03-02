import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use repo path for GitHub Pages, root for local dev
  base: process.env.GITHUB_ACTIONS ? "/openclaw-pixel-office/" : "/",
});
