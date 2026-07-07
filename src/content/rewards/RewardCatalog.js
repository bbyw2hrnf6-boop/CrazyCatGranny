import { LEVELS } from "../levels/levelRegistry.js";
import { isLevelReleased } from "../../config/ReleaseConfig.js";

export const CATBOX_COIN_FALLBACK = 125;
export const CATBOX_RARITY_WEIGHT = Object.freeze({
  Common: 54,
  Uncommon: 28,
  Rare: 13,
  Legendary: 5
});

export function rollCatBoxReward(save, world = 1, random = Math.random) {
  const available = LEVELS.filter((level) => isLevelReleased(level) && !save.rescuedCats.includes(level.cat.id));
  if (!available.length) {
    save.coins += CATBOX_COIN_FALLBACK;
    return { type: "catbox-coins", coins: CATBOX_COIN_FALLBACK };
  }
  const weighted = available.map((level) => {
    let weight = CATBOX_RARITY_WEIGHT[level.cat.rarity] || 10;
    if (level.cat.limited) weight *= 0.24;
    if (level.cat.rarity === "Rare") weight *= 1 + Math.max(0, world - 1) * 0.08;
    if (level.cat.rarity === "Legendary") weight *= 1 + Math.max(0, world - 1) * 0.12;
    return { level, weight };
  });
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.min(0.999999, Math.max(0, Number(random()) || 0)) * total;
  let selected = weighted[weighted.length - 1].level;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      selected = entry.level;
      break;
    }
  }
  save.rescuedCats.push(selected.cat.id);
  return {
    type: "catbox",
    catId: selected.cat.id,
    rarity: selected.cat.rarity,
    limited: selected.cat.limited,
    sourceWorld: Number(world) || 1
  };
}
