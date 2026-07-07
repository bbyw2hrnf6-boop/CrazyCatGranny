import { LEVELS } from "../levels/levelRegistry.js";
import { isLevelReleased } from "../../config/ReleaseConfig.js";

export const CATBOX_COIN_FALLBACK = 125;
export const CATBOX_COIN_CHANCE = 0.24;
export const CATBOX_PITY_LIMIT = 2;
export const CATBOX_RARITY_WEIGHT = Object.freeze({
  Common: 54,
  Uncommon: 28,
  Rare: 13,
  Legendary: 5
});

function coinRewardForWorld(world = 1) {
  return 80 + Math.max(0, Number(world) || 1) * 20;
}

function grantCatBoxCoins(save, world, fallback = false) {
  const coins = fallback ? CATBOX_COIN_FALLBACK : coinRewardForWorld(world);
  save.coins += coins;
  save.totalCoins += coins;
  return { type: "catbox-coins", coins };
}

export function rollCatBoxReward(save, world = 1, random = Math.random) {
  const available = LEVELS.filter((level) => isLevelReleased(level) && !save.rescuedCats.includes(level.cat.id));
  if (!available.length) {
    return grantCatBoxCoins(save, world, true);
  }
  const pity = Math.max(0, Number(save.catBoxPity) || 0);
  if (pity < CATBOX_PITY_LIMIT && (Number(random()) || 0) < CATBOX_COIN_CHANCE) {
    save.catBoxPity = pity + 1;
    return grantCatBoxCoins(save, world);
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
  save.catBoxPity = 0;
  return {
    type: "catbox",
    catId: selected.cat.id,
    rarity: selected.cat.rarity,
    limited: selected.cat.limited,
    sourceWorld: Number(world) || 1
  };
}
