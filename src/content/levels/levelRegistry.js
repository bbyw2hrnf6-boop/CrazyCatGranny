import { catForLevel } from "../cats/CatCatalog.js";
import { WORLD_1_LEVELS } from "./world1.js";
import { WORLD_2_LEVELS } from "./world2.js";
import { WORLD_3_LEVELS } from "./world3.js";
import { WORLD_4_LEVELS } from "./world4.js";
import { WORLD_5_LEVELS } from "./world5.js";

export const WORLDS = [
  { id: 1, name: "Cozy Suburbs", label: "WORLD 01", locale: "Home", sky: 0x92e1e7, ground: 0x6b9b51, accent: 0xffcf56 },
  { id: 2, name: "Lowlands Dash", label: "WORLD 02", locale: "Netherlands", sky: 0x9edbed, ground: 0x4f8c67, accent: 0xff9b4a },
  { id: 3, name: "Lantern & Neon", label: "WORLD 03", locale: "Asia Express", sky: 0x8a83bd, ground: 0x6e554d, accent: 0xffcc55 },
  { id: 4, name: "Coast to Coast", label: "WORLD 04", locale: "USA", sky: 0x74b9db, ground: 0xb06d45, accent: 0xf7df65 },
  { id: 5, name: "Moonlit Carnival", label: "WORLD 05", locale: "Grand Finale", sky: 0x332b61, ground: 0x635080, accent: 0xff6e9f }
];

const worldLevels = [WORLD_1_LEVELS, WORLD_2_LEVELS, WORLD_3_LEVELS, WORLD_4_LEVELS, WORLD_5_LEVELS];
const originalLengths = [5000, 5400, 5600, 5800, 6100, 6300, 6500, 6800, 7200];

export const LEVELS = worldLevels.flatMap((entries, worldIndex) => entries.map((entry, levelIndex) => {
  const id = worldIndex * 9 + levelIndex + 1;
  const length = worldIndex === 0
    ? originalLengths[levelIndex]
    : 6900 + worldIndex * 600 + levelIndex * 260 + (levelIndex === 8 ? 850 : 0);
  return {
    id,
    title: entry[0],
    subtitle: entry[1],
    world: worldIndex + 1,
    length,
    targetTime: Number((length / (330 + id * 4) * 1.45).toFixed(1)),
    gimmick: entry[2],
    boss: levelIndex === 8,
    cat: catForLevel(id, worldIndex, levelIndex),
    grantsCat: levelIndex === 2 || levelIndex === 5,
    grantsCatBox: levelIndex === 8
  };
}));

export function levelById(id = 1) {
  return LEVELS.find((level) => level.id === Number(id)) || LEVELS[0];
}

export function worldById(id = 1) {
  return WORLDS.find((world) => world.id === Number(id)) || WORLDS[0];
}
