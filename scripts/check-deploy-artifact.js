import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const required = [
  "dist/index.html",
  "dist/assets/sprites/granny-skate.png",
  "dist/assets/backgrounds/world-1-hd.webp",
  "dist/assets/furniture/front/scratcher-front.svg",
  "dist/assets/audio/cat-meow-pleading.mp3"
];

const missing = required.filter((path) => !existsSync(path));
const staticDir = "dist/static";
const hasBundle = existsSync(staticDir) && readdirSync(staticDir).some((file) => file.endsWith(".js"));

if (missing.length || !hasBundle) {
  if (missing.length) console.error(`Missing deploy files:\n${missing.map((path) => `- ${path}`).join("\n")}`);
  if (!hasBundle) console.error("- dist/static/*.js bundle missing");
  process.exit(1);
}

console.log(`Deploy artifact ready: ${required.length} files and JS bundle found.`);
