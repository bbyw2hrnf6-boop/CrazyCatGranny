import { getLevelsPerWorld } from "../content/GameContentStats.js";

const WORLD_TEXTURES = Object.freeze({
  1: ["crate", "glass"],
  2: ["bicycle", "tulip-cart", "crate"],
  3: ["lantern-gate", "crate", "glass"],
  4: ["road-barrier", "crate", "bicycle"],
  5: ["carnival-drum", "glass", "crate"]
});

const GIMMICK_TEXTURES = Object.freeze({
  glass: ["glass", "crate"],
  bounce: ["crate", "glass"],
  rooftop: ["crate", "glass"],
  cars: ["bicycle", "road-barrier", "crate"],
  crates: ["crate", "glass"],
  hooks: ["glass", "crate"],
  canal: ["tulip-cart", "bicycle"],
  windmill: ["tulip-cart", "crate"],
  bicycles: ["bicycle", "tulip-cart"],
  tulips: ["tulip-cart", "bicycle"],
  harbor: ["tulip-cart", "crate"],
  lanterns: ["lantern-gate", "glass"],
  market: ["lantern-gate", "crate"],
  neon: ["lantern-gate", "glass"],
  dragon: ["lantern-gate", "glass"],
  fireescape: ["road-barrier", "crate"],
  subway: ["road-barrier", "bicycle"],
  desert: ["road-barrier", "crate"],
  freeway: ["road-barrier", "bicycle"],
  hollywood: ["road-barrier", "crate"],
  gates: ["carnival-drum", "glass"],
  carousel: ["carnival-drum", "crate"],
  mirrors: ["glass", "carnival-drum"],
  ghostlights: ["glass", "carnival-drum"],
  circus: ["carnival-drum", "crate"],
  fireworks: ["carnival-drum", "glass"],
  maze: ["glass", "carnival-drum"]
});

export function planCourse(level) {
  const gaps = planGaps(level);
  const raised = planRaised(level, gaps);
  const hooks = planHooks(level, gaps);
  const obstacles = planObstacles(level, gaps);
  const coins = planCoins(level, gaps, raised, obstacles.map((entry) => entry.x));
  const awnings = planAwnings(level, gaps);
  return { gaps, raised, hooks, obstacles, coins, awnings };
}

function planGaps(level) {
  if (level.id === 1) return [[1520, 1650, false], [3300, 3440, false]];
  const gaps = [];
  const chapter = (level.id - 1) % getLevelsPerWorld();
  const stride = 1260 - level.world * 34 - Math.min(135, chapter * 14);
  for (let x = 1020, index = 0; x < level.length - 920; x += stride, index += 1) {
    const hookEvery = level.world >= 4 ? 2 : level.world >= 2 ? 3 : 4;
    const hookGimmick = ["cane", "hooks", "windmill", "harbor", "lanterns", "dragon", "canyon", "maze"].includes(level.gimmick);
    const required = index > 0 && (hookGimmick || level.world >= 3) && (index + level.id + chapter) % hookEvery === 0;
    const regularWidth = 142 + Math.min(70, level.world * 9 + chapter * 5) + ((index + level.world) % 2) * 18;
    const hookWidth = Math.min(470, 352 + level.world * 20 + chapter * 7);
    gaps.push([x, x + (required ? hookWidth : regularWidth), required]);
  }
  return gaps;
}

function planRaised(level, gaps) {
  const raised = [];
  const chapter = (level.id - 1) % getLevelsPerWorld();
  const stride = 760 + Math.max(0, 3 - level.world) * 25;
  for (let x = 650, index = 0; x < level.length - 500; x += stride, index += 1) {
    const width = 185 + ((index + level.world) % 3) * 34 + Math.min(38, chapter * 4);
    const y = 482 - ((index + level.world) % 3) * 48;
    const blocksRequiredSwing = gaps.some(([start, end, required]) => required && x < end + 210 && x + width > start - 170);
    const crowdsLanding = gaps.some(([start, end]) => x < end + 165 && x + width > end + 25);
    const crowdsTakeoff = gaps.some(([start]) => x < start - 25 && x + width > start - 175);
    if (!blocksRequiredSwing && !crowdsLanding && !crowdsTakeoff) raised.push([x, y, width]);
  }
  const finish = [level.length - 820, 398, 295];
  const finishBlocked = gaps.some(([start, end, required]) => required
    && finish[0] < end + 190 && finish[0] + finish[2] > start - 150);
  if (!finishBlocked) raised.push(finish);
  return raised;
}

function planHooks(level, gaps) {
  const hooks = level.id === 1 ? [{ x: 3380, y: 265, required: false }] : [];
  if (level.id > 1) {
    for (let x = 1180; x < level.length - 760; x += 1600 - level.world * 65) {
      const crowdsGap = gaps.some(([start, end, required]) => !required && x > start - 130 && x < end + 190);
      if (!crowdsGap) hooks.push({ x, y: 238 + (hooks.length % 2) * 28, required: false });
    }
  }
  gaps.forEach(([start, end, required], index) => {
    if (!required) return;
    const x = start + (end - start) * 0.5;
    const existing = hooks.find((point) => Math.abs(point.x - x) < 170);
    const patch = { x, y: 292 + (index % 2) * 20, required: true };
    if (existing) Object.assign(existing, patch);
    else hooks.push(patch);
  });
  return hooks.sort((a, b) => a.x - b.x);
}

function planObstacles(level, gaps) {
  const obstacles = [];
  const textures = GIMMICK_TEXTURES[level.gimmick] || WORLD_TEXTURES[level.world];
  const chapter = (level.id - 1) % getLevelsPerWorld();
  const stride = level.boss ? 950 : Math.max(1040, 1360 - level.world * 32 - chapter * 10);
  for (let x = 1340, index = 0; x < level.length - 560; x += stride, index += 1) {
    const blockingGap = gaps.find(([start, end]) => x > start - 170 && x < end + 230);
    let safeX = blockingGap ? blockingGap[1] + 190 : x;
    const nextGap = gaps.find(([start]) => start > safeX && start - safeX < 260);
    if (nextGap) safeX = nextGap[1] + 175;
    const nearRequiredHook = gaps.some(([start, end, required]) => required && safeX > start - 250 && safeX < end + 330);
    const tooCloseToLast = obstacles.some((entry) => Math.abs(entry.x - safeX) < 520);
    if (safeX < level.length - 560 && !nearRequiredHook && !tooCloseToLast) {
      obstacles.push({ x: safeX, texture: textures[(index + level.id + chapter) % textures.length] });
    }
  }
  return obstacles;
}

function planCoins(level, gaps, raised, obstacleXs) {
  const coins = [];
  let coinIndex = 0;
  for (let x = 390; x < level.length - 350; x += 135) {
    const upper = raised.find(([platformX, , width]) => x > platformX + 34 && x < platformX + width - 34);
    const overGap = gaps.some(([start, end]) => x > start - 42 && x < end + 42);
    const nearObstacle = obstacleXs.some((obstacleX) => Math.abs(x - obstacleX) < 118);
    if ((!upper && overGap) || nearObstacle) continue;
    const surfaceY = upper ? upper[1] : 590;
    coins.push({ x, y: surfaceY - 108 - Math.sin(coinIndex * 0.82) * 20 });
    coinIndex += 1;
  }
  return coins;
}

function planAwnings(level, gaps) {
  if (level.id <= 3) return [];
  const awnings = [];
  for (let x = 1700; x < level.length - 760; x += 2050) {
    const width = 205 + ((x / 50 + level.id) % 2) * 35;
    const blocksHook = gaps.some(([start, end, required]) => required && x < end + 210 && x + width > start - 190);
    const crowdsLanding = gaps.some(([, end]) => x < end + 150 && x + width > end + 20);
    if (!blocksHook && !crowdsLanding) awnings.push({ x, y: 505, width });
  }
  return awnings;
}
