export const RELEASE_CONFIG = Object.freeze({
  mode: "full-campaign",
  playableWorlds: Object.freeze([1, 2, 3, 4, 5]),
  playableLevelIds: Object.freeze([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 36,
    37, 38, 39, 40, 41, 42, 43, 44, 45
  ])
});

export function isWorldReleased(worldId) {
  return RELEASE_CONFIG.playableWorlds.includes(Number(worldId));
}

export function isLevelReleased(level) {
  return Boolean(level && RELEASE_CONFIG.playableLevelIds.includes(Number(level.id)));
}

export function nextReleasedLevelId(level, levels) {
  const index = levels.findIndex((entry) => entry.id === level.id);
  return levels.slice(index + 1).find(isLevelReleased)?.id || null;
}

export function isLevelUnlocked(level, save) {
  if (!isLevelReleased(level)) return false;
  if (level.id <= Number(save?.unlockedLevel || 1)) return true;
  if (RELEASE_CONFIG.mode === "full-campaign" && level.worldStep === 1) return true;
  const released = RELEASE_CONFIG.playableLevelIds;
  const index = released.indexOf(level.id);
  const previousId = released[index - 1];
  return index === 0 || Boolean(save?.levels?.[previousId]?.completed);
}

export function latestUnlockedReleasedLevel(save, levels) {
  return levels.filter((level) => isLevelUnlocked(level, save)).at(-1) || levels[0];
}
