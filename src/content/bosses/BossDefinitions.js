export const BOSS_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "hedge-crusher",
    worldId: 1,
    title: "THE HEDGE CRUSHER",
    color: 0x6d9b54,
    projectileTexture: "crate",
    phasePositions: [0.32, 0.59, 0.83],
    weakPointY: [430, 355, 405],
    health: 3,
    trophyWorld: 1
  }),
  Object.freeze({
    id: "stormmill-max",
    worldId: 2,
    title: "STORMMILL MAX",
    color: 0x53a6b6,
    projectileTexture: "tulip-cart",
    visualVariant: "windmill",
    phasePositions: [0.32, 0.59, 0.83],
    weakPointY: [430, 355, 405],
    health: 3,
    trophyWorld: 2
  }),
  Object.freeze({
    id: "neon-dragon",
    worldId: 3,
    title: "NEON DRAGON",
    color: 0xd55b68,
    projectileTexture: "lantern-gate",
    visualVariant: "dragon",
    phasePositions: [0.32, 0.59, 0.83],
    weakPointY: [430, 355, 405],
    health: 3,
    trophyWorld: 3
  }),
  Object.freeze({
    id: "rocket-bandit",
    worldId: 4,
    title: "ROCKET BANDIT",
    color: 0xd06749,
    projectileTexture: "road-barrier",
    visualVariant: "rocket",
    phasePositions: [0.32, 0.59, 0.83],
    weakPointY: [430, 355, 405],
    health: 3,
    trophyWorld: 4
  }),
  Object.freeze({
    id: "maestro-mech",
    worldId: 5,
    title: "MAESTRO MECH",
    color: 0x8f5ab1,
    projectileTexture: "carnival-drum",
    visualVariant: "maestro",
    phasePositions: [0.32, 0.59, 0.83],
    weakPointY: [430, 355, 405],
    health: 3,
    trophyWorld: 5
  })
]);

export function bossDefinitionForWorld(worldId) {
  return BOSS_DEFINITIONS.find((boss) => boss.worldId === Number(worldId)) || BOSS_DEFINITIONS[0];
}
