import { rollCatBoxReward } from "../content/rewards/RewardCatalog.js";
import { getBossLevelWorldPairs, getTotalLevelCount, getWorldCount } from "../content/GameContentStats.js";
import { HOME_ITEM_IDS, roomPosition } from "../visual/VisualCatalog.js";
import { cloudSaveStatus, scheduleCloudSave, startCloudSaveSync } from "./CloudSaveBridge.js";

const KEY = "crazy-cat-granny-save-v1";
const BACKUP_KEY = `${KEY}-backup`;
const BACKUP_TIME_KEY = `${BACKUP_KEY}-time`;
const MANUAL_BACKUP_KEY = `${KEY}-manual-backup`;
const MANUAL_BACKUP_TIME_KEY = `${MANUAL_BACKUP_KEY}-time`;
const SAVE_VERSION = 2;
const STARTING_COINS = 150;
const MAX_CAT_NAME_LENGTH = 18;
const MAX_ACCESSORY_OFFSET = 60;

const defaults = {
  version: SAVE_VERSION,
  coins: STARTING_COINS,
  totalCoins: STARTING_COINS,
  unlockedLevel: 1,
  rescuedCats: [],
  levels: {},
  owned: [],
  equippedHat: "none",
  equippedGear: "none",
  selectedCat: null,
  catNames: {},
  hatAssignments: {},
  catAccessoryAdjustments: {},
  activeDecor: [],
  decorPositions: {},
  worldTrophies: [],
  catBoxesOpened: [],
  pendingCatBoxes: [],
  dropHistory: [],
  selectedCharacter: "granny",
  sound: true,
  starterWalletGranted: false,
  updatedAt: 0
};

function sanitizeCatName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CAT_NAME_LENGTH);
}

function clean(data) {
  data = unpack(data);
  const result = {
    ...defaults,
    ...data,
    rescuedCats: Array.isArray(data?.rescuedCats) ? data.rescuedCats : [],
    owned: Array.isArray(data?.owned) ? data.owned : [],
    levels: data?.levels && typeof data.levels === "object" ? data.levels : {},
    catNames: data?.catNames && typeof data.catNames === "object" ? data.catNames : {},
    hatAssignments: data?.hatAssignments && typeof data.hatAssignments === "object" ? data.hatAssignments : {},
    catAccessoryAdjustments: data?.catAccessoryAdjustments && typeof data.catAccessoryAdjustments === "object" ? data.catAccessoryAdjustments : {},
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
    pendingCatBoxes: Array.isArray(data?.pendingCatBoxes) ? data.pendingCatBoxes : [],
    dropHistory: Array.isArray(data?.dropHistory) ? data.dropHistory : []
  };
  result.version = SAVE_VERSION;
  result.coins = Math.max(0, Math.floor(Number(result.coins) || 0));
  result.totalCoins = Math.max(result.coins, Math.floor(Number(result.totalCoins) || 0));
  if (result.starterWalletGranted !== true) {
    const starterTopUp = Math.max(0, STARTING_COINS - result.totalCoins);
    result.coins += starterTopUp;
    result.totalCoins += starterTopUp;
    result.starterWalletGranted = true;
  }
  result.unlockedLevel = Math.min(getTotalLevelCount(), Math.max(1, Math.floor(Number(result.unlockedLevel) || 1)));
  result.rescuedCats = [...new Set(result.rescuedCats.filter((id) => typeof id === "string"))];
  result.owned = [...new Set(result.owned.filter((id) => typeof id === "string"))];
  result.catNames = Object.fromEntries(Object.entries(result.catNames)
    .filter(([id]) => typeof id === "string")
    .map(([id, name]) => [id, sanitizeCatName(name)])
    .filter(([, name]) => name));
  result.catAccessoryAdjustments = Object.fromEntries(Object.entries(result.catAccessoryAdjustments)
    .filter(([key]) => typeof key === "string")
    .map(([key, value]) => [key, cleanAccessoryAdjustment(value)])
    .filter(([, value]) => value));
  result.activeDecor = [...new Set(result.activeDecor.filter((id) => HOME_ITEM_IDS.includes(id)))];
  result.worldTrophies = [...new Set(result.worldTrophies.map(Number).filter((id) => id >= 1 && id <= getWorldCount()))];
  result.catBoxesOpened = result.catBoxesOpened.map(Number).filter((id) => id >= 1 && id <= getWorldCount());
  result.pendingCatBoxes = result.pendingCatBoxes
    .map((box, index) => ({
      id: typeof box?.id === "string" ? box.id : `legacy-box-${index + 1}`,
      world: Math.max(1, Math.min(getWorldCount(), Number(box?.world) || 1)),
      levelId: Math.max(1, Math.min(getTotalLevelCount(), Number(box?.levelId) || 1)),
      earnedAt: Math.max(0, Math.floor(Number(box?.earnedAt) || 0))
    }))
    .filter((box) => box.id);
  result.sound = result.sound !== false;
  result.updatedAt = Math.max(0, Math.floor(Number(result.updatedAt) || 0));
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
    ...data.settings,
    ...data.meta
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
      pendingCatBoxes: save.pendingCatBoxes,
      dropHistory: save.dropHistory
    },
    inventory: {
      rescuedCats: save.rescuedCats,
      owned: save.owned,
      equippedHat: save.equippedHat,
      equippedGear: save.equippedGear,
      selectedCat: save.selectedCat,
      catNames: save.catNames,
      hatAssignments: save.hatAssignments,
      catAccessoryAdjustments: save.catAccessoryAdjustments,
      selectedCharacter: save.selectedCharacter
    },
    layout: {
      activeDecor: save.activeDecor,
      decorPositions: save.decorPositions
    },
    settings: {
      sound: save.sound
    },
    meta: {
      starterWalletGranted: save.starterWalletGranted,
      updatedAt: save.updatedAt
    }
  };
}

function accessoryKey(catId, hatId) {
  return `${catId}::${hatId}`;
}

function cleanAccessoryAdjustment(value = {}) {
  const x = Math.max(-MAX_ACCESSORY_OFFSET, Math.min(MAX_ACCESSORY_OFFSET, Math.round(Number(value.x) || 0)));
  const y = Math.max(-MAX_ACCESSORY_OFFSET, Math.min(MAX_ACCESSORY_OFFSET, Math.round(Number(value.y) || 0)));
  const scale = Math.max(0.65, Math.min(1.45, Number(value.scale) || 1));
  const angle = Math.max(-35, Math.min(35, Math.round(Number(value.angle) || 0)));
  if (!x && !y && Number(scale.toFixed(2)) === 1 && !angle) return null;
  return { x, y, scale: Number(scale.toFixed(2)), angle };
}

function progressScore(save) {
  const completed = Object.values(save.levels || {}).filter((level) => level?.completed).length;
  return completed * 100000
    + save.unlockedLevel * 1000
    + save.worldTrophies.length * 500
    + save.rescuedCats.length * 250
    + save.pendingCatBoxes.length * 180
    + save.owned.length * 40
    + save.totalCoins
    + save.coins;
}

function shouldUseCloudPayload(cloudPayload, localPayload) {
  const cloudSave = clean(cloudPayload);
  const localSave = clean(localPayload);
  const cloudScore = progressScore(cloudSave);
  const localScore = progressScore(localSave);
  if (cloudScore !== localScore) return cloudScore > localScore;
  return cloudSave.updatedAt > localSave.updatedAt;
}

function parseStored(value) {
  if (!value) return null;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid save");
  return parsed;
}

function createPendingCatBox(level) {
  const stamp = Date.now();
  return {
    id: `box-${level.world}-${level.id}-${stamp}`,
    world: level.world,
    levelId: level.id,
    earnedAt: stamp
  };
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

  write(data, options = {}) {
    const current = localStorage.getItem(KEY);
    try {
      if (parseStored(current)) {
        localStorage.setItem(BACKUP_KEY, current);
        localStorage.setItem(BACKUP_TIME_KEY, String(Date.now()));
      }
    } catch {
      // Never replace a good backup with corrupt primary data.
    }
    const cleaned = clean({
      ...data,
      updatedAt: options.preserveUpdatedAt ? data.updatedAt : Date.now()
    });
    const payload = pack(cleaned);
    localStorage.setItem(KEY, JSON.stringify(payload));
    if (options.syncCloud !== false) scheduleCloudSave(payload);
    return cleaned;
  },

  startCloudSync(onApplied) {
    return startCloudSaveSync({
      loadLocalPayload: () => pack(this.load()),
      applyCloudPayload: (payload) => {
        const cloudSave = this.write(clean(payload), { preserveUpdatedAt: true, syncCloud: false });
        onApplied?.(cloudSave);
        return cloudSave;
      },
      shouldUseCloudPayload
    });
  },

  cloudStatus() {
    return cloudSaveStatus();
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
    if (level.grantsCat && !save.rescuedCats.includes(level.cat.id)) {
      save.rescuedCats.push(level.cat.id);
      reward = {
        type: "rescue",
        catId: level.cat.id,
        rarity: level.cat.rarity,
        limited: level.cat.limited
      };
      save.dropHistory.push({ ...reward, levelId: level.id });
    } else if (firstClear && level.grantsCatBox) {
      const box = createPendingCatBox(level);
      save.pendingCatBoxes.push(box);
      reward = { type: "catbox-pending", world: level.world, levelId: level.id, boxId: box.id };
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

  openPendingCatBox(boxId = null, random = Math.random) {
    const save = this.load();
    if (!save.pendingCatBoxes.length) return { type: "none" };
    const index = boxId
      ? save.pendingCatBoxes.findIndex((box) => box.id === boxId)
      : 0;
    const safeIndex = index >= 0 ? index : 0;
    const [box] = save.pendingCatBoxes.splice(safeIndex, 1);
    const reward = rollCatBoxReward(save, box.world, random);
    save.catBoxesOpened.push(box.world);
    save.dropHistory.push({ ...reward, levelId: box.levelId, boxId: box.id });
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

  catName(catId, fallback = "Cat") {
    const save = this.load();
    return save.catNames[catId] || fallback;
  },

  renameCat(catId, name) {
    const save = this.load();
    if (!save.rescuedCats.includes(catId)) return false;
    const cleanName = sanitizeCatName(name);
    if (cleanName) save.catNames[catId] = cleanName;
    else delete save.catNames[catId];
    this.write(save);
    return true;
  },

  assignHat(hatId, catId, adjustment = null) {
    const save = this.load();
    if (!save.owned.includes(hatId) || !save.rescuedCats.includes(catId)) return false;
    const wasSameAssignment = save.hatAssignments[hatId] === catId;
    Object.keys(save.hatAssignments).forEach((ownedHat) => {
      if (save.hatAssignments[ownedHat] === catId) delete save.hatAssignments[ownedHat];
    });
    if (wasSameAssignment && !adjustment) {
      delete save.hatAssignments[hatId];
      delete save.catAccessoryAdjustments[accessoryKey(catId, hatId)];
    } else {
      save.hatAssignments[hatId] = catId;
      const cleanAdjustment = cleanAccessoryAdjustment(adjustment);
      if (cleanAdjustment) save.catAccessoryAdjustments[accessoryKey(catId, hatId)] = cleanAdjustment;
      else delete save.catAccessoryAdjustments[accessoryKey(catId, hatId)];
    }
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
      if (save.hatAssignments[hatId] === catId) {
        delete save.hatAssignments[hatId];
        delete save.catAccessoryAdjustments[accessoryKey(catId, hatId)];
      }
    });
    this.write(save);
  },

  hatAdjustment(catId, hatId) {
    const save = this.load();
    return save.catAccessoryAdjustments[accessoryKey(catId, hatId)] || { x: 0, y: 0, scale: 1, angle: 0 };
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
    const fresh = this.write({});
    return fresh;
  },

  exportBackup() {
    return JSON.stringify(pack(this.load()));
  },

  restoreBackup(serialized = localStorage.getItem(BACKUP_KEY)) {
    try {
      const restored = clean(parseStored(serialized));
      return this.write(restored);
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
        coins: STARTING_COINS,
        totalCoins: STARTING_COINS,
        starterWalletGranted: true,
        unlockedLevel: 1,
        rescuedCats: [],
        levels: {},
        worldTrophies: [],
        catBoxesOpened: [],
        pendingCatBoxes: [],
        dropHistory: [],
        selectedCat: null,
        catNames: {}
      });
    } else if (section === "layout") {
      save.activeDecor = save.owned.filter((id) => HOME_ITEM_IDS.includes(id));
      save.decorPositions = {};
    } else if (section === "settings") {
      save.sound = defaults.sound;
    } else {
      return false;
    }
    return this.write(save);
  }
};
