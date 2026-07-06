const WORLD_TEXTURES = Object.freeze({
  1: ["crate", "glass"],
  2: ["bicycle", "tulip-cart", "crate"],
  3: ["lantern-gate", "crate", "glass"],
  4: ["road-barrier", "crate", "bicycle"],
  5: ["carnival-drum", "glass", "crate"]
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
  const chapter = (level.id - 1) % 9;
  const stride = 1210 - level.world * 35 - Math.min(120, chapter * 15);
  for (let x = 1050, index = 0; x < level.length - 850; x += stride, index += 1) {
    const hookEvery = level.world >= 3 ? 2 : 3;
    const required = index > 0 && (index + level.id) % hookEvery === 0;
    const regularWidth = 158 + ((index + level.world) % 3) * 22;
    const hookWidth = Math.min(500, 390 + level.world * 18 + chapter * 8);
    gaps.push([x, x + (required ? hookWidth : regularWidth), required]);
  }
  return gaps;
}

function planRaised(level, gaps) {
  const raised = [];
  for (let x = 680, index = 0; x < level.length - 420; x += 860, index += 1) {
    const width = 250 + (index % 2) * 70;
    const blocked = gaps.some(([start, end, required]) => required && x < end + 45 && x + width > start - 45);
    if (!blocked) raised.push([x, 475 - (index % 3) * 55, width]);
  }
  const finish = [level.length - 850, 390, 380];
  const finishBlocked = gaps.some(([start, end, required]) => required
    && finish[0] < end + 45 && finish[0] + finish[2] > start - 45);
  if (!finishBlocked) raised.push(finish);
  return raised;
}

function planHooks(level, gaps) {
  const hooks = level.id === 1 ? [{ x: 3380, y: 265, required: false }] : [];
  if (level.id > 1) {
    for (let x = 1120; x < level.length - 650; x += 1500 - level.world * 55) {
      hooks.push({ x, y: 245 + (hooks.length % 2) * 30, required: false });
    }
  }
  gaps.forEach(([start, end, required], index) => {
    if (!required) return;
    const x = start + (end - start) * 0.5;
    const existing = hooks.find((point) => Math.abs(point.x - x) < 170);
    const patch = { x, y: 300 + (index % 2) * 22, required: true };
    if (existing) Object.assign(existing, patch);
    else hooks.push(patch);
  });
  return hooks.sort((a, b) => a.x - b.x);
}

function planObstacles(level, gaps) {
  const obstacles = [];
  const textures = level.world === 1 && level.gimmick === "glass"
    ? ["glass", "crate"]
    : WORLD_TEXTURES[level.world];
  for (let x = 1380, index = 0; x < level.length - 520; x += level.boss ? 850 : 1250, index += 1) {
    const blockingGap = gaps.find(([start, end]) => x > start - 90 && x < end + 90);
    const safeX = blockingGap ? blockingGap[1] + 115 : x;
    if (safeX < level.length - 520) {
      obstacles.push({ x: safeX, texture: textures[(index + level.id) % textures.length] });
    }
  }
  return obstacles;
}

function planCoins(level, gaps, raised, obstacleXs) {
  const coins = [];
  let coinIndex = 0;
  for (let x = 420; x < level.length - 350; x += 175) {
    const upper = raised.find(([platformX, , width]) => x > platformX + 34 && x < platformX + width - 34);
    const overGap = gaps.some(([start, end]) => x > start - 42 && x < end + 42);
    const nearObstacle = obstacleXs.some((obstacleX) => Math.abs(x - obstacleX) < 150);
    if ((!upper && overGap) || nearObstacle) continue;
    const surfaceY = upper ? upper[1] : 590;
    coins.push({ x, y: surfaceY - 105 - Math.sin(coinIndex * 0.82) * 18 });
    coinIndex += 1;
  }
  return coins;
}

function planAwnings(level, gaps) {
  if (level.id <= 3) return [];
  const awnings = [];
  for (let x = 1700; x < level.length - 700; x += 1900) {
    const blocksHook = gaps.some(([start, end, required]) => required && x < end + 40 && x + 250 > start - 40);
    if (!blocksHook) awnings.push({ x, y: 505, width: 250 });
  }
  return awnings;
}
