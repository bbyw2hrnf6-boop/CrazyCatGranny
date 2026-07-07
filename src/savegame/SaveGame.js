import { rollCatBoxReward } from "../content/rewards/RewardCatalog.js";
import { getBossLevelWorldPairs, getTotalLevelCount, getWorldCount } from "../content/GameContentStats.js";
import { HOME_ITEM_IDS, roomPosition } from "../visual/VisualCatalog.js";

const KEY = "crazy-cat-granny-save-v1";
const BACKUP_KEY = `${KEY}-backup`;
const BACKUP_TIME_KEY = `${BACKUP_KEY}-time`;
const MANUAL_BACKUP_KEY = `${KEY}-manual-backup`;
const MANUAL_BACKUP_TIME_KEY = `${MANUAL_BACKUP_KEY}-time`;
const SAVE_VERSION = 2;

const defaults = {
  version: SAVE_VERSION,
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
  sound: true,
  performanceMode: "auto"
};

function clean(data) {
  data = unpack(data);
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
  result.version = SAVE_VERSION;
  result.coins = Math.max(0, Math.floor(Number(result.coins) || 0));
  result.totalCoins = Math.max(result.coins, Math.floor(Number(result.totalCoins) || 0));
  result.unlockedLevel = Math.min(getTotalLevelCount(), Math.max(1, Math.floor(Number(result.unlockedLevel) || 1)));
  result.rescuedCats = [...new Set(result.rescuedCats.filter((id) => typeof id === "string"))];
  result.owned = [...new Set(result.owned.filter((id) => typeof id === "string"))];
  result.activeDecor = [...new Set(result.activeDecor.filter((id) => HOME_ITEM_IDS.includes(id)))];
  result.worldTrophies = [...new Set(result.worldTrophies.map(Number).filter((id) => id >= 1 && id <= getWorldCount()))];
  result.sound = result.sound !== false;
  result.performanceMode = ["auto", "high", "balanced"].includes(result.performanceMode)
    ? result.performanceMode
    : "auto";
  if (!Array.isArray(data?.activeDecor)) result.activeDecor = result.owned.filter((id) => HOME_ITEM_IDS.includes(id));
  if (!result.selectedCat && result.rescuedCats.length) result.selectedCat = result.rescuedCats[0];
  if (result.equippedHat !== "none" && !Object.keys(result.hatAssignments).length && result.rescuedCats.length) {
    result.hatAssignments[result.equippedHat] = result.rescuedCats[0];
  }
  getBossLevelWorldPairs().forEach(([bossLevel, world]) => {
    if (result.levels[bossLevel]?.completed) {
      result.unlockedLevel = Math.max(result.unlockedLevel, Math.min(getTotalLevelCount(), bossLevel + 1));
      if (!result.worldTrophies.includes(world)) result.worldTrophies.push(world);
    }
  });
  return result;
}

function unpack(data = {}) {
  if (!data || typeof data !== "object" || !data.progression) return data || {};
  return {
    version: data.version,
    ...data.progression,
    ...data.inventory,
    ...data.layout,
    ...data.settings
  };
}

function pack(data) {
  const save = clean(data);
  return {
    version: SAVE_VERSION,
    progression: {
      coins: save.coins,
      totalCoins: save.totalCoins,
      unlockedLevel: save.unlockedLevel,
      levels: save.levels,
      worldTrophies: save.worldTrophies,
      catBoxesOpened: save.catBoxesOpened,
      dropHistory: save.dropHistory
    },
    inventory: {
      rescuedCats: save.rescuedCats,
      owned: save.owned,
      equippedHat: save.equippedHat,
      equippedGear: save.equippedGear,
      selectedCat: save.selectedCat,
      hatAssignments: save.hatAssignments,
      selectedCharacter: save.selectedCharacter
    },
    layout: {
      activeDecor: save.activeDecor,
      decorPositions: save.decorPositions
    },
    settings: {
      sound: save.sound,
      performanceMode: save.performanceMode
    }
  };
}

function parseStored(value) {
  if (!value) return null;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid save");
  return parsed;
}

export const SaveGame = {
  load() {
    try {
      return clean(parseStored(localStorage.getItem(KEY)) || {});
    } catch {
      try {
        return clean(parseStored(localStorage.getItem(BACKUP_KEY)) || {});
      } catch {
        return clean({});
      }
    }
  },

  write(data) {
    const current = localStorage.getItem(KEY);
    try {
      if (parseStored(current)) {
        localStorage.setItem(BACKUP_KEY, current);
        localStorage.setItem(BACKUP_TIME_KEY, String(Date.now()));
      }
    } catch {
      // Never replace a good backup with corrupt primary data.
    }
    const cleaned = clean(data);
    localStorage.setItem(KEY, JSON.stringify(pack(cleaned)));
    return cleaned;
  },

  completeLevel(level, result) {
    const save = this.load();
    const old = save.levels[level.id] || {};
    const firstClear = !old.completed;
    const earned = result.coins;
    save.coins += earned;
    save.totalCoins += earned;
    save.unlockedLevel = Math.max(save.unlockedLevel, Math.min(getTotalLevelCount(), level.id + 1));
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
    } else if (firstClear && level.grantsCatBox) {
      reward = rollCatBoxReward(save, level.world);
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
    const reward = rollCatBoxReward(save, world, random);
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

  setDecorPosition(id, x, y, angle = 0, flipX = false, size = 1) {
    const save = this.load();
    if (!save.owned.includes(id) || !HOME_ITEM_IDS.includes(id)) return false;
    const position = roomPosition(id, { x, y, angle, flipX, size });
    if (!position) return false;
    save.decorPositions[id] = {
      x: Math.round(position.x),
      y: Math.round(position.y),
      angle: Math.round(position.angle),
      flipX: position.flipX,
      size: Number(position.size.toFixed(2))
    };
    this.write(save);
    return position;
  },

  setDecorLayout(layout) {
    const save = this.load();
    Object.entries(layout || {}).forEach(([id, transform]) => {
      if (!save.owned.includes(id) || !HOME_ITEM_IDS.includes(id)) return;
      const position = roomPosition(id, transform);
      if (!position) return;
      save.decorPositions[id] = {
        x: Math.round(position.x),
        y: Math.round(position.y),
        angle: Math.round(position.angle),
        flipX: position.flipX,
        size: Number(position.size.toFixed(2))
      };
    });
    this.write(save);
    return save.decorPositions;
  },

  resetDecorPositions() {
    const save = this.load();
    save.decorPositions = {};
    this.write(save);
    return true;
  },

  reset() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(BACKUP_TIME_KEY);
    return this.load();
  },

  exportBackup() {
    return JSON.stringify(pack(this.load()));
  },

  restoreBackup(serialized = localStorage.getItem(BACKUP_KEY)) {
    try {
      const restored = clean(parseStored(serialized));
      localStorage.setItem(KEY, JSON.stringify(pack(restored)));
      return restored;
    } catch {
      return false;
    }
  },

  createManualBackup() {
    localStorage.setItem(MANUAL_BACKUP_KEY, this.exportBackup());
    localStorage.setItem(MANUAL_BACKUP_TIME_KEY, String(Date.now()));
    return this.backupStatus();
  },

  restoreManualBackup() {
    return this.restoreBackup(localStorage.getItem(MANUAL_BACKUP_KEY));
  },

  backupStatus() {
    const stamp = (key) => {
      const value = Number(localStorage.getItem(key));
      return value > 0 ? new Date(value).toISOString() : null;
    };
    return {
      automatic: Boolean(localStorage.getItem(BACKUP_KEY)),
      automaticAt: stamp(BACKUP_TIME_KEY),
      manual: Boolean(localStorage.getItem(MANUAL_BACKUP_KEY)),
      manualAt: stamp(MANUAL_BACKUP_TIME_KEY)
    };
  },

  resetSection(section) {
    const save = this.load();
    if (section === "progression") {
      Object.assign(save, {
        coins: 0,
        totalCoins: 0,
        unlockedLevel: 1,
        rescuedCats: [],
        levels: {},
        worldTrophies: [],
        catBoxesOpened: [],
        dropHistory: [],
        selectedCat: null
      });
    } else if (section === "layout") {
      save.activeDecor = save.owned.filter((id) => HOME_ITEM_IDS.includes(id));
      save.decorPositions = {};
    } else if (section === "settings") {
      save.sound = defaults.sound;
      save.performanceMode = defaults.performanceMode;
    } else {
      return false;
    }
    return this.write(save);
  }
};
