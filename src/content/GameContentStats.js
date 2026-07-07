import { LEVELS, WORLDS } from "./levels/levelRegistry.js";
import { CAT_CATALOG } from "./cats/CatCatalog.js";

export function getWorldCount() {
  return WORLDS.length;
}

export function getTotalCatCount() {
  return CAT_CATALOG.length;
}

export function getLevelsForWorld(worldId) {
  return LEVELS.filter((level) => level.world === Number(worldId));
}

export function getLevelCountForWorld(worldId) {
  return getLevelsForWorld(worldId).length;
}

export function getTotalLevelCount() {
  return LEVELS.length;
}

export function getFirstLevelIdForWorld(worldId) {
  return getLevelsForWorld(worldId)[0]?.id || 1;
}

export function getBossLevelWorldPairs() {
  return LEVELS.filter((level) => level.boss).map((level) => [level.id, level.world]);
}

export function isBossLevel(levelId) {
  return Boolean(LEVELS.find((level) => level.id === Number(levelId))?.boss);
}

export function getLevelsPerWorld() {
  return getLevelCountForWorld(WORLDS[0]?.id || 1);
}
