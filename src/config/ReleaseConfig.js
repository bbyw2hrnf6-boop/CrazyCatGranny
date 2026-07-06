export const RELEASE_CONFIG = Object.freeze({
  mode: "vertical-slice",
  playableWorlds: Object.freeze([1]),
  playableLevelIds: Object.freeze([1, 2, 3, 4, 5, 9])
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
  const released = RELEASE_CONFIG.playableLevelIds;
  const index = released.indexOf(level.id);
  const previousId = released[index - 1];
  return index === 0 || Boolean(save?.levels?.[previousId]?.completed);
}

export function latestUnlockedReleasedLevel(save, levels) {
  return levels.filter((level) => isLevelUnlocked(level, save)).at(-1) || levels[0];
}
