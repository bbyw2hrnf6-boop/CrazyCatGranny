const PHASES = Object.freeze([0.32, 0.59, 0.83]);
const WEAK_POINTS = Object.freeze([430, 355, 405]);

const part = (type, props) => Object.freeze({ type, ...props });

export const BOSS_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "hedge-crusher",
    worldId: 1,
    title: "THE HEDGE CRUSHER",
    color: 0x6d9b54,
    projectileTexture: "crate",
    phasePositions: PHASES,
    weakPointY: WEAK_POINTS,
    health: 3,
    trophyWorld: 1,
    bodyParts: Object.freeze([
      part("ellipse", { role: "body", x: 0, y: 16, width: 205, height: 132, color: 0x6d9b54, stroke: 8 }),
      part("circle", { role: "leaf", x: -80, y: -45, radius: 27, color: 0x8bbf68, stroke: 4 }),
      part("circle", { role: "leaf", x: 75, y: -48, radius: 31, color: 0x95c86f, stroke: 4 }),
      part("rect", { role: "vine", x: -120, y: 28, width: 78, height: 16, color: 0x4d7f43, stroke: 4, angle: -18 }),
      part("rect", { role: "vine", x: 120, y: 28, width: 78, height: 16, color: 0x4d7f43, stroke: 4, angle: 18 }),
      part("circle", { role: "eye", x: -42, y: -5, radius: 20, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "eye", x: 42, y: -5, radius: 20, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "pupil", x: -42, y: -5, radius: 7, color: 0x2f2335 }),
      part("circle", { role: "pupil", x: 42, y: -5, radius: 7, color: 0x2f2335 }),
      part("rect", { role: "mouth", x: 0, y: 48, width: 92, height: 18, color: 0x34293a, stroke: 3 })
    ]),
    idleAnimation: Object.freeze({ bobMs: 720, tilt: 3, pulseRole: "leaf" }),
    attackPattern: Object.freeze([
      Object.freeze({ type: "vine-slam", label: "VINE SLAM", interval: 1850, telegraphColor: 0x6d9b54 }),
      Object.freeze({ type: "crate-burst", label: "HEDGE TOSS", interval: 1500, telegraphColor: 0xffcc4d })
    ]),
    telegraph: Object.freeze({ copy: "WATCH THE GROUND", color: 0x6d9b54 }),
    phaseSetPiece: Object.freeze({ type: "roots", color: 0x4d7f43 })
  }),
  Object.freeze({
    id: "stormmill-max",
    worldId: 2,
    title: "STORMMILL MAX",
    color: 0x53a6b6,
    projectileTexture: "tulip-cart",
    phasePositions: PHASES,
    weakPointY: WEAK_POINTS,
    health: 3,
    trophyWorld: 2,
    bodyParts: Object.freeze([
      part("ellipse", { role: "body", x: 0, y: 20, width: 190, height: 126, color: 0x53a6b6, stroke: 8 }),
      part("rect", { role: "spinner", x: 0, y: -78, width: 16, height: 178, color: 0xfff1d3, stroke: 3 }),
      part("rect", { role: "spinner", x: 0, y: -78, width: 16, height: 178, color: 0xfff1d3, stroke: 3, angle: 90 }),
      part("circle", { role: "spinner", x: 0, y: -78, radius: 22, color: 0xf0b944, stroke: 5 }),
      part("circle", { role: "eye", x: -42, y: -2, radius: 20, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "eye", x: 42, y: -2, radius: 20, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "pupil", x: -42, y: -2, radius: 7, color: 0x2f2335 }),
      part("circle", { role: "pupil", x: 42, y: -2, radius: 7, color: 0x2f2335 }),
      part("rect", { role: "mouth", x: 0, y: 50, width: 88, height: 18, color: 0x34293a, stroke: 3 })
    ]),
    idleAnimation: Object.freeze({ bobMs: 560, tilt: 2, spinRole: "spinner", spinMs: 1200 }),
    attackPattern: Object.freeze([
      Object.freeze({ type: "wind-gust", label: "GUST LANE", interval: 1300, telegraphColor: 0x53a6b6 }),
      Object.freeze({ type: "cart-toss", label: "TULIP TOSS", interval: 1650, telegraphColor: 0xff9b4a })
    ]),
    telegraph: Object.freeze({ copy: "WIND SHIFT", color: 0x53a6b6 }),
    phaseSetPiece: Object.freeze({ type: "wind", color: 0xbdefff })
  }),
  Object.freeze({
    id: "neon-dragon",
    worldId: 3,
    title: "NEON DRAGON",
    color: 0xd55b68,
    projectileTexture: "lantern-gate",
    phasePositions: PHASES,
    weakPointY: WEAK_POINTS,
    health: 3,
    trophyWorld: 3,
    bodyParts: Object.freeze([
      part("ellipse", { role: "segment", x: -110, y: 42, width: 92, height: 70, color: 0x7e5cc4, stroke: 5 }),
      part("ellipse", { role: "segment", x: -58, y: 16, width: 100, height: 76, color: 0x9b61cb, stroke: 5 }),
      part("ellipse", { role: "body", x: 18, y: 8, width: 165, height: 112, color: 0xd55b68, stroke: 8 }),
      part("triangle", { role: "horn", x: -65, y: -58, points: [0, 20, 42, -42, 72, 28], color: 0xe9c24e }),
      part("triangle", { role: "horn", x: 74, y: -58, points: [0, 25, -42, -42, -70, 28], color: 0xe9c24e }),
      part("circle", { role: "eye", x: -32, y: -4, radius: 18, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "eye", x: 52, y: -4, radius: 18, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "pupil", x: -32, y: -4, radius: 6, color: 0x2f2335 }),
      part("circle", { role: "pupil", x: 52, y: -4, radius: 6, color: 0x2f2335 }),
      part("text", { role: "glow", x: 14, y: 62, text: "◇", size: 36, color: "#ffdc63" })
    ]),
    idleAnimation: Object.freeze({ bobMs: 660, tilt: 4, pulseRole: "segment" }),
    attackPattern: Object.freeze([
      Object.freeze({ type: "neon-breath", label: "NEON BREATH", interval: 1420, telegraphColor: 0xff6e9f }),
      Object.freeze({ type: "lantern-wave", label: "LANTERN WAVE", interval: 1660, telegraphColor: 0xffcc55 })
    ]),
    telegraph: Object.freeze({ copy: "BREATHE", color: 0xff6e9f }),
    phaseSetPiece: Object.freeze({ type: "neon-rings", color: 0xff6e9f })
  }),
  Object.freeze({
    id: "rocket-bandit",
    worldId: 4,
    title: "ROCKET BANDIT",
    color: 0xd06749,
    projectileTexture: "road-barrier",
    phasePositions: PHASES,
    weakPointY: WEAK_POINTS,
    health: 3,
    trophyWorld: 4,
    bodyParts: Object.freeze([
      part("ellipse", { role: "body", x: 0, y: 12, width: 172, height: 124, color: 0xd06749, stroke: 8 }),
      part("triangle", { role: "nose", x: 0, y: -90, points: [-48, 30, 0, -58, 48, 30], color: 0xe9eef0 }),
      part("triangle", { role: "fin", x: -72, y: 52, points: [0, -12, -48, 54, 20, 38], color: 0x4b86c5 }),
      part("triangle", { role: "fin", x: 72, y: 52, points: [0, -12, 48, 54, -20, 38], color: 0x4b86c5 }),
      part("triangle", { role: "flame", x: 0, y: 105, points: [-32, -18, 0, 58, 32, -18], color: 0xffc84e }),
      part("circle", { role: "eye", x: -38, y: -2, radius: 19, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "eye", x: 38, y: -2, radius: 19, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "pupil", x: -38, y: -2, radius: 7, color: 0x2f2335 }),
      part("circle", { role: "pupil", x: 38, y: -2, radius: 7, color: 0x2f2335 }),
      part("rect", { role: "mouth", x: 0, y: 48, width: 84, height: 18, color: 0x34293a, stroke: 3 })
    ]),
    idleAnimation: Object.freeze({ bobMs: 420, tilt: 5, pulseRole: "flame" }),
    attackPattern: Object.freeze([
      Object.freeze({ type: "sign-salve", label: "SIGN SALVE", interval: 1250, telegraphColor: 0xf7df65 }),
      Object.freeze({ type: "dive-bomb", label: "DIVE BOMB", interval: 1900, telegraphColor: 0xec5966 }),
      Object.freeze({ type: "shockwave", label: "GROUND WAVE", interval: 1550, telegraphColor: 0xd06749 })
    ]),
    telegraph: Object.freeze({ copy: "INCOMING", color: 0xec5966 }),
    phaseSetPiece: Object.freeze({ type: "smoke", color: 0xe9eef0 })
  }),
  Object.freeze({
    id: "maestro-mech",
    worldId: 5,
    title: "MAESTRO MECH",
    color: 0x8f5ab1,
    projectileTexture: "carnival-drum",
    phasePositions: PHASES,
    weakPointY: WEAK_POINTS,
    health: 3,
    trophyWorld: 5,
    bodyParts: Object.freeze([
      part("ellipse", { role: "body", x: 0, y: 18, width: 196, height: 128, color: 0x8f5ab1, stroke: 8 }),
      part("rect", { role: "hat", x: 0, y: -86, width: 108, height: 30, color: 0x33243d, stroke: 4 }),
      part("rect", { role: "hat", x: 0, y: -124, width: 72, height: 76, color: 0x33243d, stroke: 4 }),
      part("rect", { role: "baton", x: -108, y: -4, width: 112, height: 10, color: 0xfff1d3, stroke: 3, angle: -28 }),
      part("rect", { role: "baton", x: 108, y: -4, width: 112, height: 10, color: 0xfff1d3, stroke: 3, angle: 28 }),
      part("circle", { role: "eye", x: -42, y: -2, radius: 19, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "eye", x: 42, y: -2, radius: 19, color: 0xfff3d0, stroke: 5 }),
      part("circle", { role: "pupil", x: -42, y: -2, radius: 7, color: 0x2f2335 }),
      part("circle", { role: "pupil", x: 42, y: -2, radius: 7, color: 0x2f2335 }),
      part("text", { role: "note", x: 0, y: 82, text: "♫", size: 38, color: "#ffdc63" })
    ]),
    idleAnimation: Object.freeze({ bobMs: 520, tilt: 3, pulseRole: "note", swingRole: "baton" }),
    attackPattern: Object.freeze([
      Object.freeze({ type: "note-wave", label: "NOTE WAVE", interval: 1180, telegraphColor: 0xff6e9f }),
      Object.freeze({ type: "drum-roll", label: "DRUM ROLL", interval: 1450, telegraphColor: 0xffcc4d }),
      Object.freeze({ type: "spotlight", label: "SPOTLIGHT", interval: 1800, telegraphColor: 0xbdefff }),
      Object.freeze({ type: "crescendo", label: "CRESCENDO", interval: 2200, telegraphColor: 0xec5966 })
    ]),
    telegraph: Object.freeze({ copy: "COUNT BEATS", color: 0xff6e9f }),
    phaseSetPiece: Object.freeze({ type: "spotlights", color: 0xff6e9f })
  })
]);

export function bossDefinitionForWorld(worldId) {
  return BOSS_DEFINITIONS.find((boss) => boss.worldId === Number(worldId)) || BOSS_DEFINITIONS[0];
}
