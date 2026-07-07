import { BOSS_DEFINITIONS } from "../src/content/bosses/BossDefinitions.js";
import { CAT_CATALOG } from "../src/content/cats/CatCatalog.js";
import {
  getTotalCatCount,
  getTotalLevelCount,
  getWorldCount
} from "../src/content/GameContentStats.js";
import { LEVELS, WORLDS } from "../src/content/levels/levelRegistry.js";
import { RELEASE_CONFIG } from "../src/config/ReleaseConfig.js";

const errors = [];
const unique = (values) => new Set(values).size === values.length;

if (!unique(LEVELS.map((level) => level.id))) errors.push("Level IDs must be unique.");
if (!unique(CAT_CATALOG.map((cat) => cat.id))) errors.push("Cat IDs must be unique.");
if (getTotalLevelCount() !== LEVELS.length) errors.push("Total level count does not match LEVELS.");
if (getTotalCatCount() !== CAT_CATALOG.length) errors.push("Total cat count does not match CAT_CATALOG.");
if (getWorldCount() !== WORLDS.length) errors.push("World count does not match WORLDS.");

RELEASE_CONFIG.playableLevelIds.forEach((levelId) => {
  if (!LEVELS.some((level) => level.id === levelId)) errors.push(`Released level ${levelId} does not exist.`);
});

BOSS_DEFINITIONS.forEach((boss) => {
  ["id", "worldId", "title", "color", "projectileTexture", "phasePositions", "weakPointY", "health"].forEach((field) => {
    if (boss[field] === undefined) errors.push(`Boss ${boss.id || "(missing id)"} missing ${field}.`);
  });
  if (!WORLDS.some((world) => world.id === boss.worldId)) errors.push(`Boss ${boss.id} references unknown world ${boss.worldId}.`);
});

LEVELS.filter((level) => level.boss).forEach((level) => {
  if (!BOSS_DEFINITIONS.some((boss) => boss.worldId === level.world)) {
    errors.push(`Boss level ${level.id} has no boss definition for world ${level.world}.`);
  }
});

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Content validation passed: ${LEVELS.length} levels, ${CAT_CATALOG.length} cats, ${BOSS_DEFINITIONS.length} bosses.`);
