const catNames = [
  "Mimi", "Shadow", "Otto", "Luna", "Sushi", "Pepper", "Ginger", "Pixel", "Duchess",
  "Poffertje", "Muis", "Stroop", "Nola", "Willem", "Fietje", "Tulp", "Gouda", "Oranje",
  "Mochi", "Miso", "Kiki", "Bao", "Sora", "Yuki", "Tora", "Nori", "Hoshi",
  "Jazz", "Brooklyn", "Sunny", "Scout", "Rocket", "Blue", "Dakota", "Liberty", "Clover",
  "Spark", "Velvet", "Boo", "Comet", "Taffy", "Jinx", "Nova", "Riddle", "Maestro"
];

const catTraits = [
  "Cuddly. Snack-focused.", "Silent. Shelf assassin.", "Round. Proud of it.",
  "Elegant chaos agent.", "Judges everyone.", "Fast paws, no regrets.",
  "Window watcher.", "Possibly from space.", "Owns the house now."
];

const catColors = [0xf59d38, 0x393244, 0xb98d6d, 0xf7f0df, 0xd8c2a2, 0x6d6a76, 0xe67e32, 0x8ec3d8, 0xc88db4];
const legacyCatIds = ["mimi", "shadow", "otto", "luna", "sushi", "pepper", "ginger", "pixel", "duchess"];
const limitedCatIndexes = [8, 17, 26, 35, 44, 14, 32, 41];

export function catForLevel(levelId, worldIndex, levelIndex) {
  const catIndex = levelId - 1;
  const name = catNames[catIndex];
  return {
    id: worldIndex === 0
      ? legacyCatIds[levelIndex]
      : `cat-${levelId}-${name.toLowerCase().replaceAll(" ", "-")}`,
    name,
    color: catColors[catIndex % catColors.length],
    rarity: levelIndex === 8 ? "Legendary" : levelIndex >= 6 ? "Rare" : levelIndex >= 3 ? "Uncommon" : "Common",
    limited: limitedCatIndexes.includes(catIndex),
    trait: catTraits[catIndex % catTraits.length]
  };
}

export const CAT_CATALOG = Object.freeze(
  catNames.map((name, index) => Object.freeze({
    id: index < legacyCatIds.length
      ? legacyCatIds[index]
      : `cat-${index + 1}-${name.toLowerCase().replaceAll(" ", "-")}`,
    name,
    color: catColors[index % catColors.length],
    rarity: index % 9 === 8 ? "Legendary" : index % 9 >= 6 ? "Rare" : index % 9 >= 3 ? "Uncommon" : "Common",
    limited: limitedCatIndexes.includes(index),
    trait: catTraits[index % catTraits.length]
  }))
);
