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

export const WORLDS = [
  { id: 1, name: "Cozy Suburbs", label: "WORLD 01", locale: "Home", sky: 0x92e1e7, ground: 0x6b9b51, accent: 0xffcf56 },
  { id: 2, name: "Lowlands Dash", label: "WORLD 02", locale: "Netherlands", sky: 0x9edbed, ground: 0x4f8c67, accent: 0xff9b4a },
  { id: 3, name: "Lantern & Neon", label: "WORLD 03", locale: "Asia Express", sky: 0x8a83bd, ground: 0x6e554d, accent: 0xffcc55 },
  { id: 4, name: "Coast to Coast", label: "WORLD 04", locale: "USA", sky: 0x74b9db, ground: 0xb06d45, accent: 0xf7df65 },
  { id: 5, name: "Moonlit Carnival", label: "WORLD 05", locale: "Grand Finale", sky: 0x332b61, ground: 0x635080, accent: 0xff6e9f }
];

const worldLevels = [
  [
    ["The Chase Begins", "Jump the garden fence!", "jump"],
    ["Try the Cane", "Hold cane near gold hooks.", "cane"],
    ["Glass Act", "Crash through the greenhouse.", "glass"],
    ["Market Mayhem", "Bounce across the awnings.", "bounce"],
    ["Rooftop Chase", "Take the high road.", "rooftop"],
    ["Rush Hour", "Traffic has nine lives.", "cars"],
    ["Hard Hat Cat", "Mind the falling crates.", "crates"],
    ["Hook, Line & Granny", "Chain your swings.", "hooks"],
    ["Suburb Showdown", "Boss run: catch the garden bandit!", "boss-suburb"]
  ],
  [
    ["Canal Kickoff", "Leap the first blue canal.", "canal"],
    ["Windmill Whirl", "Hook onto turning windmill arms.", "windmill"],
    ["Bicycle Ballet", "Thread through the morning traffic.", "bicycles"],
    ["Tulip Trouble", "Spring across flower carts.", "tulips"],
    ["Rain on the Rails", "Wet rooftops mean long slides.", "rain"],
    ["Cheese Market Chase", "Crates roll downhill.", "cheese"],
    ["Harbor Hook", "Swing between old sail masts.", "harbor"],
    ["Dike Dash", "Race the rising water.", "dike"],
    ["King of the Windmills", "Boss run: survive the storm mill!", "boss-windmill"]
  ],
  [
    ["Lantern Lane", "Lantern chains make gentle swings.", "lanterns"],
    ["Bamboo Bounce", "Bamboo bends, then launches.", "bamboo"],
    ["Market Roofs", "Choose speed or snack stalls.", "market"],
    ["Monsoon Motion", "Wind and rain change every jump.", "monsoon"],
    ["Temple Bells", "Ring bells to open the path.", "bells"],
    ["Neon Night", "Follow the glowing coin trail.", "neon"],
    ["Mountain Rail", "Race above the clouds.", "rail"],
    ["Dragon Bridge", "A long chain of cane swings.", "dragon"],
    ["Neon Dragon Run", "Boss run: the thief goes turbo!", "boss-dragon"]
  ],
  [
    ["Brooklyn Bound", "Fire escapes form a ladder road.", "fireescape"],
    ["Subway Surf", "Time jumps over rushing trains.", "subway"],
    ["Desert Detour", "Hot air gives jumps extra lift.", "desert"],
    ["Canyon Echo", "Cane hooks hide under arches.", "canyon"],
    ["Bayou Bounce", "Spring from boats and old docks.", "bayou"],
    ["Freeway Frenzy", "Moving cars are your platforms.", "freeway"],
    ["Space Coast", "Low gravity near the launch pad.", "space"],
    ["Hollywood Hills", "Smash through the movie set.", "hollywood"],
    ["Liberty Sprint", "Boss run: a coast-to-coast finale!", "boss-liberty"]
  ],
  [
    ["Midnight Gates", "The carnival opens after dark.", "gates"],
    ["Carousel Chaos", "Platforms circle and rise.", "carousel"],
    ["Hall of Mirrors", "Some roads are only reflections.", "mirrors"],
    ["Ghost-Light Glide", "Follow friendly floating lights.", "ghostlights"],
    ["Rollercoaster Rescue", "Keep speed on the giant drop.", "coaster"],
    ["Big Top Bounce", "Cannons and nets launch Granny.", "circus"],
    ["Firework Flight", "Rocket boosts light the sky.", "fireworks"],
    ["The Grand Maze", "Hooks reveal the fastest route.", "maze"],
    ["Maestro's Last Run", "Final boss: rescue every last cat!", "boss-maestro"]
  ]
];

const originalLengths = [5000, 5400, 5600, 5800, 6100, 6300, 6500, 6800, 7200];

export const LEVELS = worldLevels.flatMap((entries, worldIndex) => entries.map((entry, levelIndex) => {
  const id = worldIndex * 9 + levelIndex + 1;
  const length = worldIndex === 0
    ? originalLengths[levelIndex]
    : 6900 + worldIndex * 600 + levelIndex * 260 + (levelIndex === 8 ? 850 : 0);
  const catIndex = id - 1;
  return {
    id,
    title: entry[0],
    subtitle: entry[1],
    world: worldIndex + 1,
    length,
    targetTime: Number((length / (330 + id * 4) * 1.45).toFixed(1)),
    gimmick: entry[2],
    boss: levelIndex === 8,
    cat: {
      id: worldIndex === 0
        ? legacyCatIds[levelIndex]
        : `cat-${id}-${catNames[catIndex].toLowerCase().replaceAll(" ", "-")}`,
      name: catNames[catIndex],
      color: catColors[catIndex % catColors.length],
      rarity: levelIndex === 8 ? "Legendary" : levelIndex >= 6 ? "Rare" : levelIndex >= 3 ? "Uncommon" : "Common",
      limited: [8, 17, 26, 35, 44, 14, 32, 41].includes(catIndex),
      trait: catTraits[catIndex % catTraits.length]
    },
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
