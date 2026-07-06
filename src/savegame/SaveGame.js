const KEY = "crazy-cat-granny-save-v1";
const HOME_ITEMS = ["scratcher", "catbed", "yarnbasket", "aquarium", "windowseat", "catbridge", "velvetsofa", "wallpaper"];

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
  worldTrophies: [],
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
    worldTrophies: Array.isArray(data?.worldTrophies) ? data.worldTrophies : []
  };
  if (!Array.isArray(data?.activeDecor)) result.activeDecor = result.owned.filter((id) => HOME_ITEMS.includes(id));
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
    if (!save.rescuedCats.includes(level.cat.id)) save.rescuedCats.push(level.cat.id);
    save.levels[level.id] = {
      completed: true,
      paws: Math.max(old.paws || 0, result.paws),
      treats: Math.max(old.treats || 0, result.treats),
      bestTime: old.bestTime ? Math.min(old.bestTime, result.time) : result.time,
      noFalls: Boolean(old.noFalls || result.falls === 0)
    };
    if (level.boss && !save.worldTrophies.includes(level.world)) save.worldTrophies.push(level.world);
    this.write(save);
    return { save, firstClear };
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
    if (!save.owned.includes(id) || !HOME_ITEMS.includes(id)) return false;
    if (save.activeDecor.includes(id)) save.activeDecor = save.activeDecor.filter((item) => item !== id);
    else save.activeDecor.push(id);
    this.write(save);
    return true;
  },

  reset() {
    localStorage.removeItem(KEY);
    return this.load();
  }
};
