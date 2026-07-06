import { defineConfig } from "vite";

export default defineConfig({
  // Relative output paths work both at a custom domain and at /CrazyCatGranny/.
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "static",
    sourcemap: false
  }
});
