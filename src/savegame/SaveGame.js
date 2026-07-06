import { LEVELS } from "../levels/levels.js";
import { HOME_ITEM_IDS, roomPosition } from "../visual/VisualCatalog.js";

const KEY = "crazy-cat-granny-save-v1";

const defaults = {
  coins: 0,
  totalCoins: 0,
  unlockedLevel: 1,
  rescuedCats: [],
  levels: {},
  owned: [],
  equippedHat: "none",
  equippedGear: "none",
  selectedCat: null,
  hatAssignments: {},
  activeDecor: [],
  decorPositions: {},
  worldTrophies: [],
  catBoxesOpened: [],
  dropHistory: [],
  selectedCharacter: "granny",
  sound: true
};

function clean(data) {
  const result = {
    ...defaults,
    ...data,
    rescuedCats: Array.isArray(data?.rescuedCats) ? data.rescuedCats : [],
    owned: Array.isArray(data?.owned) ? data.owned : [],
    levels: data?.levels && typeof data.levels === "object" ? data.levels : {},
    hatAssignments: data?.hatAssignments && typeof data.hatAssignments === "object" ? data.hatAssignments : {},
    activeDecor: Array.isArray(data?.activeDecor) ? data.activeDecor : [],
    decorPositions: data?.decorPositions && typeof data.decorPositions === "object"
      ? Object.fromEntries(HOME_ITEM_IDS.flatMap((id) => {
        if (!data.decorPositions[id]) return [];
        const position = roomPosition(id, data.decorPositions[id]);
        return position ? [[id, position]] : [];
      }))
      : {},
    worldTrophies: Array.isArray(data?.worldTrophies) ? data.worldTrophies : [],
    catBoxesOpened: Array.isArray(data?.catBoxesOpened) ? data.catBoxesOpened : [],
    dropHistory: Array.isArray(data?.dropHistory) ? data.dropHistory : []
  };
  if (!Array.isArray(data?.activeDecor)) result.activeDecor = result.owned.filter((id) => HOME_ITEM_IDS.includes(id));
  if (!result.selectedCat && result.rescuedCats.length) result.selectedCat = result.rescuedCats[0];
  if (result.equippedHat !== "none" && !Object.keys(result.hatAssignments).length && result.rescuedCats.length) {
    result.hatAssignments[result.equippedHat] = result.rescuedCats[0];
  }
  [[9, 1], [18, 2], [27, 3], [36, 4], [45, 5]].forEach(([bossLevel, world]) => {
    if (result.levels[bossLevel]?.completed) {
      result.unlockedLevel = Math.max(result.unlockedLevel, Math.min(45, bossLevel + 1));
      if (!result.worldTrophies.includes(world)) result.worldTrophies.push(world);
    }
  });
  return result;
}

export const SaveGame = {
  load() {
    try {
      return clean(JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      return clean({});
    }
  },

  write(data) {
    localStorage.setItem(KEY, JSON.stringify(clean(data)));
    return data;
  },

  completeLevel(level, result) {
    const save = this.load();
    const old = save.levels[level.id] || {};
    const firstClear = !old.completed;
    const earned = result.coins;
    save.coins += earned;
    save.totalCoins += earned;
    save.unlockedLevel = Math.max(save.unlockedLevel, Math.min(45, level.id + 1));
    let reward = { type: "none" };
    if (firstClear && level.grantsCat && !save.rescuedCats.includes(level.cat.id)) {
      save.rescuedCats.push(level.cat.id);
      reward = {
        type: "rescue",
        catId: level.cat.id,
        rarity: level.cat.rarity,
        limited: level.cat.limited
      };
      save.dropHistory.push({ ...reward, levelId: level.id });
    } else if (level.grantsCatBox) {
      reward = rollCatBox(save, level.world);
      save.catBoxesOpened.push(level.world);
      save.dropHistory.push({ ...reward, levelId: level.id });
    }
    save.levels[level.id] = {
      completed: true,
      paws: Math.max(old.paws || 0, result.paws),
      treats: Math.max(old.treats || 0, result.treats),
      bestTime: old.bestTime ? Math.min(old.bestTime, result.time) : result.time,
      noFalls: Boolean(old.noFalls || result.falls === 0)
    };
    if (level.boss && !save.worldTrophies.includes(level.world)) save.worldTrophies.push(level.world);
    this.write(save);
    return { save, firstClear, reward };
  },

  openCatBox(world, random = Math.random) {
    const save = this.load();
    const reward = rollCatBox(save, world, random);
    save.catBoxesOpened.push(Number(world) || 1);
    save.dropHistory.push({ ...reward, levelId: null });
    this.write(save);
    return reward;
  },

  buy(item) {
    const save = this.load();
    if (save.owned.includes(item.id) || save.coins < item.price) return false;
    save.coins -= item.price;
    save.owned.push(item.id);
    if (item.tab === "HOME" && !save.activeDecor.includes(item.id)) save.activeDecor.push(item.id);
    this.write(save);
    return true;
  },

  equipHat(id) {
    const save = this.load();
    if (id === "none" || save.owned.includes(id)) {
      save.equippedHat = id;
      this.write(save);
    }
  },

  selectCat(catId) {
    const save = this.load();
    if (save.rescuedCats.includes(catId)) {
      save.selectedCat = catId;
      this.write(save);
    }
  },

  assignHat(hatId, catId) {
    const save = this.load();
    if (!save.owned.includes(hatId) || !save.rescuedCats.includes(catId)) return false;
    const wasSameAssignment = save.hatAssignments[hatId] === catId;
    Object.keys(save.hatAssignments).forEach((ownedHat) => {
      if (save.hatAssignments[ownedHat] === catId) delete save.hatAssignments[ownedHat];
    });
    if (wasSameAssignment) delete save.hatAssignments[hatId];
    else save.hatAssignments[hatId] = catId;
    save.selectedCat = catId;
    save.equippedHat = "none";
    this.write(save);
    return true;
  },

  hatForCat(catId) {
    const save = this.load();
    return Object.keys(save.hatAssignments).find((hatId) => save.hatAssignments[hatId] === catId) || "none";
  },

  clearCatHat(catId) {
    const save = this.load();
    Object.keys(save.hatAssignments).forEach((hatId) => {
      if (save.hatAssignments[hatId] === catId) delete save.hatAssignments[hatId];
    });
    this.write(save);
  },

  equipGear(id) {
    const save = this.load();
    if (id === "none" || save.owned.includes(id)) {
      save.equippedGear = id;
      this.write(save);
    }
  },

  toggleDecor(id) {
    const save = this.load();
    if (!save.owned.includes(id) || !HOME_ITEM_IDS.includes(id)) return false;
    if (save.activeDecor.includes(id)) save.activeDecor = save.activeDecor.filter((item) => item !== id);
    else save.activeDecor.push(id);
    this.write(save);
    return true;
  },

  setDecorPosition(id, x, y) {
    const save = this.load();
    if (!save.owned.includes(id) || !HOME_ITEM_IDS.includes(id)) return false;
    const position = roomPosition(id, { x, y });
    if (!position) return false;
    save.decorPositions[id] = { x: Math.round(position.x), y: Math.round(position.y) };
    this.write(save);
    return position;
  },

  resetDecorPositions() {
    const save = this.load();
    save.decorPositions = {};
    this.write(save);
    return true;
  },

  reset() {
    localStorage.removeItem(KEY);
    return this.load();
  }
};

function rollCatBox(save, world = 1, random = Math.random) {
  const available = LEVELS.filter((level) => !save.rescuedCats.includes(level.cat.id));
  if (!available.length) {
    save.coins += 125;
    return { type: "catbox-coins", coins: 125 };
  }
  const rarityWeight = { Common: 54, Uncommon: 28, Rare: 13, Legendary: 5 };
  const weighted = available.map((level) => {
    let weight = rarityWeight[level.cat.rarity] || 10;
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
