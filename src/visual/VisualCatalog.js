import { getLevelsPerWorld, getTotalCatCount, getWorldCount } from "../content/GameContentStats.js";

export const VISUAL_RULES = Object.freeze({
  catFrameSize: 418,
  accessoryFrameSize: 418,
  gearFrameSize: 627,
  previewDepth: 1,
  shadowColor: 0x2f2335,
  shadowAlpha: 0.16
});

export const GRANNY_FRAME_SIZE = 512;

export const GRANNY_GEAR_ANCHORS = Object.freeze({
  default: {
    head: { x: 0, y: -186, angle: 0, scale: 1 },
    torso: { x: 30, y: 18, angle: 0, scale: 1 },
    hand: { x: 56, y: -10, angle: 0, scale: 1 }
  },
  0: {
    head: { x: -4, y: -188, angle: -3, scale: 1 },
    torso: { x: 29, y: 18, angle: -1, scale: 1 }
  },
  1: {
    head: { x: 4, y: -194, angle: 3, scale: 1.02 },
    torso: { x: 32, y: 15, angle: 2, scale: 1.01 }
  },
  2: {
    head: { x: 2, y: -190, angle: 1, scale: 1 },
    torso: { x: 31, y: 17, angle: 0, scale: 1 }
  },
  3: {
    head: { x: 10, y: -184, angle: 8, scale: 1.01 },
    torso: { x: 35, y: 22, angle: 6, scale: 1 }
  }
});

const HEAD_ANCHORS = [
  [[-76, -137], [-73, -139], [-73, -138], [-79, -139], [-72, -134], [-75, -138], [-76, -136], [-70, -136], [-75, -137]],
  [[-98, -148], [4, -91], [-124, -143], [-76, -139], [-102, -154], [-140, -142], [-103, -148], [-102, -145], [-140, -143]],
  [[101, -164], [-67, -144], [-65, -154], [111, -177], [53, -162], [-125, -167], [81, -195], [-67, -190], [-115, -195]],
  [[-24, -150], [-57, -90], [-65, -145], [-64, -159], [-67, -178], [-115, -160], [-39, -180], [-67, -168], [-85, -172]],
  [[91, -159], [73, -164], [70, -139], [-19, -197], [83, -167], [65, -177], [-109, -195], [-107, -180], [65, -185]]
];

const hats = [
  { id: "partyHat", name: "Party Hat", icon: "△", price: 35, color: 0xec5966, frame: 0, attachScale: 0.54, originY: 0.59, anchor: "head" },
  { id: "crown", name: "Tiny Crown", icon: "♛", price: 85, color: 0xffcc4d, frame: 1, attachScale: 0.52, originY: 0.59, anchor: "head" },
  { id: "cowboy", name: "Meowboy Hat", icon: "⌒", price: 105, color: 0x9b633d, frame: 2, attachScale: 0.46, originY: 0.59, anchor: "head", offsetY: 3 },
  { id: "beanie", name: "Blue Beanie", icon: "●", price: 125, color: 0x4b86c5, frame: 3, attachScale: 0.5, originY: 0.58, anchor: "head", offsetY: 4 },
  { id: "witchHat", name: "Moon Witch Hat", icon: "▲", price: 155, color: 0x6b4a86, frame: 4, attachScale: 0.43, originY: 0.57, anchor: "head", offsetY: -2 },
  { id: "vikingHat", name: "Tiny Viking", icon: "♈", price: 175, color: 0x8394a0, frame: 5, attachScale: 0.46, originY: 0.56, anchor: "head", offsetY: 2 },
  { id: "bowHat", name: "Velvet Bow", icon: "∞", price: 95, color: 0xd9576d, frame: 6, attachScale: 0.45, originY: 0.56, anchor: "head", offsetY: 12 },
  { id: "sunHat", name: "Sun Bonnet", icon: "☀", price: 140, color: 0xf2c44f, frame: 7, attachScale: 0.43, originY: 0.53, anchor: "head", offsetY: 5 },
  {
    id: "redBandana", name: "Rescue Bandana", icon: "◆", price: 90, color: 0xe85454,
    texture: "cat-costume-red-bandana", asset: "assets/cat-costumes/red-bandana.svg",
    attachScale: 0.34, originY: 0.52, anchor: "neck", offsetY: 6, detail: "Neck outfit"
  },
  {
    id: "roundGlasses", name: "Round Glasses", icon: "∞", price: 115, color: 0x4a7db8,
    texture: "cat-costume-round-glasses", asset: "assets/cat-costumes/round-glasses.svg",
    attachScale: 0.28, originY: 0.5, anchor: "face", offsetY: 1, detail: "Face outfit"
  },
  {
    id: "flowerCollar", name: "Flower Collar", icon: "✿", price: 135, color: 0xf0a65d,
    texture: "cat-costume-flower-collar", asset: "assets/cat-costumes/flower-collar.svg",
    attachScale: 0.32, originY: 0.52, anchor: "neck", offsetY: 3, detail: "Neck outfit"
  },
  {
    id: "starCape", name: "Star Cape", icon: "★", price: 165, color: 0x6f7fd9,
    texture: "cat-costume-star-cape", asset: "assets/cat-costumes/star-cape.svg",
    attachScale: 0.36, originY: 0.36, anchor: "back", offsetY: 12, depthOffset: 0.5, detail: "Back outfit"
  }
].map((item) => ({
  ...item,
  tab: "HATS",
  kind: "hat",
  texture: item.texture || "cat-accessories",
  detail: item.detail || "Cat outfit",
  previewScale: item.previewScale || 0.24
}));

const furniture = [
  {
    id: "scratcher", name: "Scratch Tower", icon: "♜", price: 75, color: 0xc88755,
    asset: "assets/furniture/front/scratcher-front.svg",
    room: {
      x: 390, y: 400, scale: 0.42,
      anchors: [
        { type: "play", x: 382, y: 560 },
        { type: "watch", x: 440, y: 555 }
      ],
      perches: [
        { x: 364, y: 435, path: [[340, 560], [350, 480], [364, 435]] },
        { x: 382, y: 328, path: [[340, 560], [350, 480], [364, 435], [382, 328]] },
        { x: 340, y: 235, path: [[340, 560], [350, 480], [364, 435], [382, 328], [340, 235]] }
      ]
    }
  },
  {
    id: "catbed", name: "Cloud Bed", icon: "☁", price: 95, color: 0xa4d6db,
    asset: "assets/furniture/front/catbed-front.svg",
    room: {
      x: 1085, y: 560, scale: 0.36,
      anchors: [
        { type: "sleep", x: 1085, y: 548 },
        { type: "social", x: 1038, y: 585 }
      ],
      perches: [{ x: 1085, y: 548, path: [[1060, 600], [1085, 548]] }]
    }
  },
  {
    id: "yarnbasket", name: "Yarn Basket", icon: "◉", price: 120, color: 0x9e5b9d,
    asset: "assets/furniture/front/yarnbasket-front.svg",
    room: {
      x: 520, y: 570, scale: 0.32,
      anchors: [
        { type: "play", x: 520, y: 548 },
        { type: "social", x: 575, y: 585 }
      ]
    }
  },
  {
    id: "aquarium", name: "Tiny Aquarium", icon: "◈", price: 180, color: 0x51b3c1,
    asset: "assets/furniture/front/aquarium-front.svg",
    room: {
      x: 1110, y: 205, scale: 0.34,
      anchors: [
        { type: "watch", x: 1068, y: 540 },
        { type: "social", x: 1125, y: 580 }
      ]
    }
  },
  {
    id: "windowseat", name: "Window Throne", icon: "▣", price: 140, color: 0x78aec9,
    asset: "assets/furniture/front/windowseat-front.svg",
    room: {
      x: 1110, y: 448, scale: 0.32,
      anchors: [
        { type: "sleep", x: 1110, y: 394 },
        { type: "watch", x: 1050, y: 545 }
      ],
      perches: [{ x: 1110, y: 394, path: [[1050, 585], [1085, 485], [1110, 394]] }]
    }
  },
  {
    id: "catbridge", name: "Wall Bridge", icon: "⌁", price: 165, color: 0xc88a58,
    asset: "assets/furniture/front/catbridge-front.svg",
    room: {
      x: 790, y: 270, scale: 0.48,
      anchors: [
        { type: "watch", x: 725, y: 295 },
        { type: "play", x: 690, y: 570 }
      ],
      perches: [
        { x: 725, y: 295, path: [[680, 570], [690, 390], [725, 295]] },
        { x: 805, y: 235, path: [[680, 570], [690, 390], [725, 295], [805, 235]] }
      ]
    }
  },
  {
    id: "velvetsofa", name: "Velvet Sofa", icon: "▰", price: 210, color: 0x835d8c,
    asset: "assets/furniture/front/velvetsofa-front.svg",
    room: {
      x: 700, y: 445, scale: 0.66,
      anchors: [
        { type: "sleep", x: 635, y: 365 },
        { type: "sleep", x: 740, y: 365 },
        { type: "social", x: 700, y: 545 }
      ],
      perches: [
        { x: 635, y: 365, path: [[600, 585], [620, 440], [635, 365]] },
        { x: 740, y: 365, path: [[760, 585], [750, 440], [740, 365]] }
      ]
    }
  },
  {
    id: "roundtree", name: "Round Cat Tree", icon: "○", price: 240, color: 0xd79a5c,
    asset: "assets/furniture/front/roundtree-front.svg",
    detail: "Climb and nap",
    room: {
      x: 460, y: 510, scale: 0.42,
      anchors: [
        { type: "play", x: 430, y: 570 },
        { type: "sleep", x: 470, y: 430 }
      ],
      perches: [
        { x: 470, y: 430, path: [[430, 580], [450, 500], [470, 430]] },
        { x: 505, y: 325, path: [[430, 580], [450, 500], [470, 430], [505, 325]] }
      ]
    }
  },
  {
    id: "moonperch", name: "Moon Perch", icon: "☾", price: 175, color: 0xa8b9e8,
    asset: "assets/furniture/front/moonperch-front.svg",
    detail: "Wall nap perch",
    room: {
      x: 575, y: 255, scale: 0.38,
      anchors: [
        { type: "watch", x: 550, y: 315 },
        { type: "sleep", x: 590, y: 282 }
      ],
      perches: [{ x: 590, y: 282, path: [[555, 570], [550, 390], [590, 282]] }]
    }
  },
  {
    id: "bookcaseperch", name: "Bookcase Perch", icon: "▤", price: 260, color: 0x9c6c52,
    asset: "assets/furniture/front/bookcaseperch-front.svg",
    detail: "Shelves and paths",
    room: {
      x: 875, y: 500, scale: 0.42,
      anchors: [
        { type: "watch", x: 835, y: 525 },
        { type: "social", x: 900, y: 585 }
      ],
      perches: [
        { x: 835, y: 418, path: [[900, 585], [870, 520], [835, 418]] },
        { x: 910, y: 338, path: [[900, 585], [870, 520], [835, 418], [910, 338]] }
      ]
    }
  },
  {
    id: "fishcondo", name: "Fish Condo", icon: "◇", price: 230, color: 0x50a9b5,
    asset: "assets/furniture/front/fishcondo-front.svg",
    detail: "Hide and play",
    room: {
      x: 940, y: 575, scale: 0.36,
      anchors: [
        { type: "play", x: 910, y: 590 },
        { type: "sleep", x: 960, y: 540 }
      ],
      perches: [{ x: 960, y: 540, path: [[920, 598], [940, 575], [960, 540]] }]
    }
  },
  {
    id: "wallpaper", name: "Paw Wallpaper", icon: "⁙", price: 190, color: 0xe79b9f,
    asset: "assets/furniture/front/wallpaper-front.svg",
    room: { wallpaper: true }
  }
].map((item) => ({
  ...item,
  tab: "HOME",
  kind: "furniture",
  texture: `furniture-${item.id}`,
  detail: item.detail || (item.id === "catbed" ? "Cats nap here"
    : item.id === "yarnbasket" ? "Cats play here"
      : item.id === "aquarium" ? "Cat television"
        : item.id === "windowseat" ? "Sunny nap spot"
          : item.id === "catbridge" ? "Shared climbing path"
            : item.id === "velvetsofa" ? "Room centerpiece"
              : item.id === "wallpaper" ? "Whole-room style"
                : "Placed in Cat House"),
  previewScale: 0.2
}));

const gear = [
  {
    id: "helmetBoost", name: "Crash Helmet", icon: "⛑", price: 45, color: 0xf1b63b, frame: 0,
    detail: "Faster recovery",
    granny: {
      anchor: "head",
      x: 0,
      y: -5,
      scale: 0.072,
      angle: 0,
      originX: 0.54,
      originY: 0.53,
      frameAnchors: {
        0: { angle: -3, scale: 0.96 },
        1: { angle: 2, scale: 0.98 },
        2: { angle: 1, scale: 0.96 },
        3: { angle: 7, scale: 0.96 }
      }
    }
  },
  {
    id: "bananaBoost", name: "Banana Belt", icon: "⌣", price: 55, color: 0xffd34d, frame: 1,
    detail: "Slows the thief", granny: { anchor: "torso", x: 8, y: 42, scale: 0.078, angle: -8 }
  },
  {
    id: "magnetBoost", name: "Coin Magnet", icon: "∩", price: 100, color: 0xeb6067, frame: 2,
    detail: "Pulls nearby coins", granny: { anchor: "torso", x: -18, y: 22, scale: 0.082, angle: 8 }
  },
  {
    id: "yarnBoost", name: "Turbo Yarn", icon: "●", price: 80, color: 0x7b4d86, frame: 3,
    detail: "Faster skates", granny: { anchor: "torso", x: 20, y: 30, scale: 0.078, angle: 0 }
  }
].map((item) => ({
  ...item,
  tab: "GEAR",
  kind: "gear",
  texture: "granny-gear",
  previewScale: 0.14
}));

const grannySkins = [
  { id: "grannyClassic", name: "Classic Granny", price: 0, color: 0xec5966, detail: "Original chase look", texture: "granny-skate", animation: "granny-skating", effect: "dust" },
  { id: "grannyElegant", name: "Elegant Granny", price: 95, color: 0x6f7fd9, detail: "Fancy full skin", texture: "granny-skin-elegant", animation: "granny-skating-elegant", costume: "elegant", effect: "sparkle" },
  { id: "grannySporty", name: "Sporty Granny", price: 120, color: 0x41b9ad, detail: "Track-day full skin", texture: "granny-skin-sporty", animation: "granny-skating-sporty", costume: "sporty", effect: "streak" },
  { id: "grannyPunk", name: "Punk Granny", price: 150, color: 0x7b4d86, detail: "Loud full skin", texture: "granny-skin-punk", animation: "granny-skating-punk", costume: "punk", effect: "bolt" },
  { id: "grannyRoyal", name: "Royal Granny", price: 210, color: 0xffcc4d, detail: "Regal full skin", texture: "granny-skin-royal", animation: "granny-skating-royal", costume: "royal", effect: "royal" }
].map((item) => ({
  ...item,
  tab: "GRANNY",
  kind: "grannySkin",
  frame: 0,
  previewScale: 0.17
}));

const thiefSkins = [
  { id: "thiefDefault", name: "Default Thief", price: 0, color: 0x2f2335, detail: "Original chaser", texture: "thief-run", animation: "thief-running" },
  { id: "thiefBlackCoat", name: "Black Coat", price: 85, color: 0x14151b, detail: "Shadow coat", texture: "thief-skin-black-coat", animation: "thief-running-black-coat", costume: "blackCoat" },
  { id: "thiefGentleman", name: "Gentleman", price: 115, color: 0x9b633d, detail: "Fancy chase look", texture: "thief-skin-gentleman", animation: "thief-running-gentleman", costume: "gentleman" },
  { id: "thiefRaccoonBandit", name: "Raccoon Bandit", price: 150, color: 0x8394a0, detail: "Masked full skin", texture: "thief-skin-raccoon", animation: "thief-running-raccoon", costume: "raccoon" },
  { id: "thiefCyber", name: "Cyber Thief", price: 190, color: 0x41b9ad, detail: "Neon runner", texture: "thief-skin-cyber", animation: "thief-running-cyber", costume: "cyber" }
].map((item) => ({
  ...item,
  tab: "THIEF",
  kind: "thiefSkin",
  frame: 0,
  previewScale: 0.17
}));

const roomStyles = [
  { id: "roomWarm", name: "Warm Room", price: 0, color: 0xf4d8ac, tint: 0xffe0a1, wallColor: 0xffd3a0, floorColor: 0xd89b63, detail: "Soft default tones" },
  { id: "roomMint", name: "Mint Room", price: 55, color: 0x41b9ad, tint: 0xa7eadf, wallColor: 0xa7eadf, floorColor: 0x77bfa6, detail: "Fresh wall tint" },
  { id: "roomSunset", name: "Sunset Room", price: 65, color: 0xec5966, tint: 0xffb1a1, wallColor: 0xffb1a1, floorColor: 0xd98765, detail: "Cozy color pass" },
  { id: "roomNight", name: "Night Room", price: 80, color: 0x6f7fd9, tint: 0x9ea5e8, wallColor: 0x9ea5e8, floorColor: 0x6e6388, detail: "Calm evening vibe" }
].map((item) => ({
  ...item,
  tab: "ROOM",
  kind: "roomStyle",
  texture: "room-wallpaper",
  frame: undefined,
  previewScale: 0.12
}));

export const HAT_ITEMS = Object.freeze(hats);
export const HOME_ITEMS = Object.freeze(furniture);
export const GEAR_ITEMS = Object.freeze(gear);
export const GRANNY_SKINS = Object.freeze(grannySkins);
export const THIEF_SKINS = Object.freeze(thiefSkins);
export const ROOM_STYLES = Object.freeze(roomStyles);
export const SHOP_ITEMS = Object.freeze([...hats, ...furniture, ...gear, ...grannySkins, ...thiefSkins, ...roomStyles]);
export const HOME_ITEM_IDS = Object.freeze(furniture.map((item) => item.id));
export const GRANNY_SKIN_IDS = Object.freeze(grannySkins.map((item) => item.id));
export const THIEF_SKIN_IDS = Object.freeze(thiefSkins.map((item) => item.id));
export const ROOM_STYLE_IDS = Object.freeze(roomStyles.map((item) => item.id));

const ITEM_LOOKUP = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

export function visualItem(id) {
  return ITEM_LOOKUP.get(id) || null;
}

export function roomPosition(itemId, savedPosition = null) {
  const item = visualItem(itemId);
  if (!item?.room || item.room.wallpaper) return null;
  const bounds = { minX: 330, maxX: 1220, minY: 145, maxY: 605 };
  const value = Number(savedPosition?.x);
  const savedX = Number.isFinite(value) ? value : item.room.x;
  const yValue = Number(savedPosition?.y);
  const savedY = Number.isFinite(yValue) ? yValue : item.room.y;
  const angleValue = Number(savedPosition?.angle);
  const angle = Number.isFinite(angleValue)
    ? ((angleValue + 180) % 360 + 360) % 360 - 180
    : 0;
  const sizeValue = Number(savedPosition?.size);
  const size = Number.isFinite(sizeValue)
    ? Math.max(0.55, Math.min(1.6, sizeValue))
    : 1;
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, savedX)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, savedY)),
    angle,
    flipX: Boolean(savedPosition?.flipX),
    size
  };
}

export function catVisual(frame = 0) {
  const levelsPerWorld = getLevelsPerWorld();
  const safeFrame = Math.max(0, Math.min(getTotalCatCount() - 1, Number(frame) || 0));
  const world = Math.floor(safeFrame / levelsPerWorld);
  const [x, y] = HEAD_ANCHORS[world][safeFrame % levelsPerWorld];
  const facingBias = x < 0 ? -1 : 1;
  return {
    texture: `cat-real-${world + 1}`,
    frame: safeFrame % levelsPerWorld,
    globalFrame: safeFrame,
    anchors: {
      head: { x, y },
      face: { x: x * 0.78, y: y + 54 },
      neck: { x: x * 0.5, y: y + 116 },
      back: { x: x * 0.24 - 44 * facingBias, y: y + 132 }
    }
  };
}

export const VISUAL_ASSETS = Object.freeze({
  images: [
    ...Array.from({ length: getWorldCount() }, (_, index) => [`world-bg-${index + 1}`, `assets/backgrounds/world-${index + 1}-hd.png`]),
    ["cat-house-bg", "assets/backgrounds/cat-house-front.svg"],
    ["shop-bg", "assets/backgrounds/shop-hd.png"],
    ["room-wallpaper", "assets/backgrounds/paw-wallpaper.png"],
    ...furniture.map((item) => [item.texture, item.asset || `assets/furniture/${item.id}.png`]),
    ...hats.filter((item) => item.asset).map((item) => [item.texture, item.asset])
  ],
  sheets: [
    ["granny-skate", "assets/sprites/granny-skate.png", 512, 512],
    ["thief-run", "assets/sprites/thief-run.png", 512, 512],
    ...grannySkins
      .filter((skin) => skin.texture !== "granny-skate")
      .map((skin) => [skin.texture, `assets/sprites/${skin.texture}.png`, 512, 512]),
    ...thiefSkins
      .filter((skin) => skin.texture !== "thief-run")
      .map((skin) => [skin.texture, `assets/sprites/${skin.texture}.png`, 512, 512]),
    ...Array.from({ length: getWorldCount() }, (_, index) => [
      `cat-real-${index + 1}`,
      `assets/sprites/${index === 0 ? "cat-atlas.png" : `cat-atlas-world${index + 1}.png`}`,
      VISUAL_RULES.catFrameSize,
      VISUAL_RULES.catFrameSize
    ]),
    ["cat-accessories", "assets/sprites/cat-accessories.png", VISUAL_RULES.accessoryFrameSize, VISUAL_RULES.accessoryFrameSize],
    ["granny-gear", "assets/sprites/granny-gear.png", VISUAL_RULES.gearFrameSize, VISUAL_RULES.gearFrameSize]
  ]
});
