import { defineConfig } from "vite";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function copyGameAssets() {
  return {
    name: "copy-game-assets",
    apply: "build",
    closeBundle() {
      const source = resolve(process.cwd(), "assets");
      const destination = resolve(process.cwd(), "dist", "assets");
      if (!existsSync(source)) throw new Error("Game assets directory is missing.");
      cpSync(source, destination, { recursive: true });
    }
  };
}

export default defineConfig({
  // Relative output paths work both at a custom domain and at /CrazyCatGranny/.
  base: "./",
  plugins: [copyGameAssets()],
  build: {
    outDir: "dist",
    assetsDir: "static",
    sourcemap: false
  }
});
