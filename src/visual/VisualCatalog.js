export const VISUAL_RULES = Object.freeze({
  catFrameSize: 418,
  accessoryFrameSize: 418,
  gearFrameSize: 627,
  previewDepth: 1,
  shadowColor: 0x2f2335,
  shadowAlpha: 0.16
});

const HEAD_ANCHORS = [
  [[-76, -137], [-73, -139], [-73, -138], [-79, -139], [-72, -134], [-75, -138], [-76, -136], [-70, -136], [-75, -137]],
  [[-98, -148], [4, -91], [-124, -143], [-76, -139], [-102, -154], [-140, -142], [-103, -148], [-102, -145], [-140, -143]],
  [[101, -164], [-67, -144], [-65, -154], [111, -177], [53, -162], [-125, -167], [81, -195], [-67, -190], [-115, -195]],
  [[-24, -150], [-57, -90], [-65, -145], [-64, -159], [-67, -178], [-115, -160], [-39, -180], [-67, -168], [-85, -172]],
  [[91, -159], [73, -164], [70, -139], [-19, -197], [83, -167], [65, -177], [-109, -195], [-107, -180], [65, -185]]
];

const hats = [
  { id: "partyHat", name: "Party Hat", icon: "△", price: 25, color: 0xec5966, frame: 0, attachScale: 0.54, originY: 0.59 },
  { id: "crown", name: "Tiny Crown", icon: "♛", price: 60, color: 0xffcc4d, frame: 1, attachScale: 0.52, originY: 0.59 },
  { id: "cowboy", name: "Meowboy Hat", icon: "⌒", price: 90, color: 0x9b633d, frame: 2, attachScale: 0.46, originY: 0.59 },
  { id: "beanie", name: "Blue Beanie", icon: "●", price: 110, color: 0x4b86c5, frame: 3, attachScale: 0.5, originY: 0.58 },
  { id: "witchHat", name: "Moon Witch Hat", icon: "▲", price: 135, color: 0x6b4a86, frame: 4, attachScale: 0.43, originY: 0.57 },
  { id: "vikingHat", name: "Tiny Viking", icon: "♈", price: 150, color: 0x8394a0, frame: 5, attachScale: 0.46, originY: 0.56 },
  { id: "bowHat", name: "Velvet Bow", icon: "∞", price: 80, color: 0xd9576d, frame: 6, attachScale: 0.45, originY: 0.56, offsetY: 12 },
  { id: "sunHat", name: "Sun Bonnet", icon: "☀", price: 120, color: 0xf2c44f, frame: 7, attachScale: 0.43, originY: 0.53 }
].map((item) => ({
  ...item,
  tab: "HATS",
  kind: "hat",
  texture: "cat-accessories",
  detail: "Cat outfit",
  previewScale: 0.24
}));

const furniture = [
  {
    id: "scratcher", name: "Scratch Tower", icon: "♜", price: 75, color: 0xc88755,
    room: {
      x: 390, y: 400, scale: 0.42,
      perches: [
        { x: 364, y: 435, path: [[340, 560], [350, 480], [364, 435]] },
        { x: 382, y: 328, path: [[340, 560], [350, 480], [364, 435], [382, 328]] },
        { x: 340, y: 235, path: [[340, 560], [350, 480], [364, 435], [382, 328], [340, 235]] }
      ]
    }
  },
  {
    id: "catbed", name: "Cloud Bed", icon: "☁", price: 95, color: 0xa4d6db,
    room: { x: 1085, y: 560, scale: 0.36, perches: [{ x: 1085, y: 548, path: [[1060, 600], [1085, 548]] }] }
  },
  { id: "yarnbasket", name: "Yarn Basket", icon: "◉", price: 120, color: 0x9e5b9d, room: { x: 520, y: 570, scale: 0.32 } },
  { id: "aquarium", name: "Tiny Aquarium", icon: "◈", price: 180, color: 0x51b3c1, room: { x: 1110, y: 205, scale: 0.34, wall: true } },
  {
    id: "windowseat", name: "Window Throne", icon: "▣", price: 140, color: 0x78aec9,
    room: { x: 1015, y: 430, scale: 0.36, wall: true, perches: [{ x: 1015, y: 370, path: [[980, 585], [1015, 470], [1015, 370]] }] }
  },
  {
    id: "catbridge", name: "Wall Bridge", icon: "⌁", price: 165, color: 0xc88a58,
    room: {
      x: 790, y: 270, scale: 0.48, wall: true,
      perches: [
        { x: 725, y: 295, path: [[680, 570], [690, 390], [725, 295]] },
        { x: 805, y: 235, path: [[680, 570], [690, 390], [725, 295], [805, 235]] }
      ]
    }
  },
  {
    id: "velvetsofa", name: "Velvet Sofa", icon: "▰", price: 210, color: 0x835d8c,
    room: {
      x: 700, y: 445, scale: 0.66,
      perches: [
        { x: 635, y: 365, path: [[600, 585], [620, 440], [635, 365]] },
        { x: 740, y: 365, path: [[760, 585], [750, 440], [740, 365]] }
      ]
    }
  },
  { id: "wallpaper", name: "Paw Wallpaper", icon: "⁙", price: 190, color: 0xe79b9f, room: { wallpaper: true } }
].map((item) => ({
  ...item,
  tab: "HOME",
  kind: "furniture",
  texture: `furniture-${item.id}`,
  detail: item.id === "catbed" ? "Cats nap here"
    : item.id === "yarnbasket" ? "Cats play here"
      : item.id === "aquarium" ? "Cat television"
        : item.id === "windowseat" ? "Sunny nap spot"
          : item.id === "catbridge" ? "Shared climbing path"
            : item.id === "velvetsofa" ? "Room centerpiece"
              : item.id === "wallpaper" ? "Whole-room style"
                : "Placed in Cat House",
  previewScale: 0.2
}));

const gear = [
  {
    id: "helmetBoost", name: "Crash Helmet", icon: "⛑", price: 45, color: 0xf1b63b, frame: 0,
    detail: "Faster recovery", granny: { x: 0, y: -54, scale: 0.095, angle: 0 }
  },
  {
    id: "bananaBoost", name: "Banana Belt", icon: "⌣", price: 55, color: 0xffd34d, frame: 1,
    detail: "Slows the thief", granny: { x: 34, y: 12, scale: 0.078, angle: -12 }
  },
  {
    id: "magnetBoost", name: "Coin Magnet", icon: "∩", price: 100, color: 0xeb6067, frame: 2,
    detail: "Pulls nearby coins", granny: { x: 35, y: 7, scale: 0.09, angle: 10 }
  },
  {
    id: "yarnBoost", name: "Turbo Yarn", icon: "●", price: 80, color: 0x7b4d86, frame: 3,
    detail: "Faster skates", granny: { x: 35, y: 5, scale: 0.085, angle: 0 }
  }
].map((item) => ({
  ...item,
  tab: "GEAR",
  kind: "gear",
  texture: "granny-gear",
  previewScale: 0.14
}));

export const HAT_ITEMS = Object.freeze(hats);
export const HOME_ITEMS = Object.freeze(furniture);
export const GEAR_ITEMS = Object.freeze(gear);
export const SHOP_ITEMS = Object.freeze([...hats, ...furniture, ...gear]);
export const HOME_ITEM_IDS = Object.freeze(furniture.map((item) => item.id));

const ITEM_LOOKUP = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

export function visualItem(id) {
  return ITEM_LOOKUP.get(id) || null;
}

export function catVisual(frame = 0) {
  const safeFrame = Math.max(0, Math.min(44, Number(frame) || 0));
  const world = Math.floor(safeFrame / 9);
  const [x, y] = HEAD_ANCHORS[world][safeFrame % 9];
  return {
    texture: `cat-real-${world + 1}`,
    frame: safeFrame % 9,
    globalFrame: safeFrame,
    anchors: { head: { x, y } }
  };
}

export const VISUAL_ASSETS = Object.freeze({
  images: [
    ...Array.from({ length: 5 }, (_, index) => [`world-bg-${index + 1}`, `assets/backgrounds/world-${index + 1}-hd.png`]),
    ["cat-house-bg", "assets/backgrounds/cat-house-hd.png"],
    ["shop-bg", "assets/backgrounds/shop-hd.png"],
    ["room-wallpaper", "assets/backgrounds/paw-wallpaper.png"],
    ...furniture.map((item) => [item.texture, `assets/furniture/${item.id}.png`])
  ],
  sheets: [
    ["granny-skate", "assets/sprites/granny-skate.png", 512, 512],
    ["thief-run", "assets/sprites/thief-run.png", 512, 512],
    ...Array.from({ length: 5 }, (_, index) => [
      `cat-real-${index + 1}`,
      `assets/sprites/${index === 0 ? "cat-atlas.png" : `cat-atlas-world${index + 1}.png`}`,
      VISUAL_RULES.catFrameSize,
      VISUAL_RULES.catFrameSize
    ]),
    ["cat-accessories", "assets/sprites/cat-accessories.png", VISUAL_RULES.accessoryFrameSize, VISUAL_RULES.accessoryFrameSize],
    ["granny-gear", "assets/sprites/granny-gear.png", VISUAL_RULES.gearFrameSize, VISUAL_RULES.gearFrameSize]
  ]
});
