import { addHatArt } from "../ui/ItemArt.js";

export const CAT_FRAME_SIZE = 418;

const HEAD_ANCHORS = [
  [[-76, -137], [-73, -139], [-73, -138], [-79, -139], [-72, -134], [-75, -138], [-76, -136], [-70, -136], [-75, -137]],
  [[-98, -148], [4, -91], [-124, -143], [-76, -139], [-102, -154], [-140, -142], [-103, -148], [-102, -145], [-140, -143]],
  [[101, -164], [-67, -144], [-65, -154], [111, -177], [53, -162], [-125, -167], [81, -195], [-67, -190], [-115, -195]],
  [[-24, -150], [-57, -90], [-65, -145], [-64, -159], [-67, -178], [-115, -160], [-39, -180], [-67, -168], [-85, -172]],
  [[91, -159], [73, -164], [70, -139], [-19, -197], [83, -167], [65, -177], [-109, -195], [-107, -180], [65, -185]]
];

export function addDetailedCat(scene, x, y, frame = 0, scale = 0.25) {
  const world = Phaser.Math.Clamp(Math.floor(frame / 9) + 1, 1, 5);
  return scene.add.image(x, y, `cat-real-${world}`, frame % 9)
    .setScale(scale)
    .setData("catFrame", frame)
    .setData("headAnchor", catHeadAnchor(frame));
}

export function catHeadAnchor(frame = 0) {
  const safe = Phaser.Math.Clamp(Number(frame) || 0, 0, 44);
  const world = Math.floor(safe / 9);
  const [x, y] = HEAD_ANCHORS[world][safe % 9];
  return { x, y };
}

export function addCatHat(scene, cat, hatId, depth = cat.depth + 1) {
  if (!hatId || hatId === "none") return null;
  const hat = addHatArt(scene, hatId, cat.x, cat.y, Math.abs(cat.scaleX) * 2.35)
    .setData("hatId", hatId)
    .setDepth(depth);
  syncCatHat(cat, hat);
  return hat;
}

export function syncCatHat(cat, hat) {
  if (!cat?.active || !hat?.active) return;
  const anchor = cat.getData("headAnchor") || { x: -75, y: -140 };
  const scaleX = Math.abs(cat.scaleX);
  const scaleY = Math.abs(cat.scaleY);
  const direction = cat.flipX ? -1 : 1;
  hat.setPosition(cat.x + anchor.x * scaleX * direction, cat.y + anchor.y * scaleY);
  hat.setAngle(cat.angle);
  hat.setDepth(cat.depth + 1);
}

export function animateCat(scene, cat, options = {}) {
  const baseY = cat.y;
  const delay = options.delay ?? (cat.frame.name % 5) * 90;
  scene.tweens.add({
    targets: cat,
    y: baseY - (options.bob ?? 5),
    scaleY: cat.scaleY * 1.018,
    duration: options.duration ?? 900,
    delay,
    yoyo: true,
    repeat: -1,
    ease: "Sine.inOut"
  });
  if (options.wander) {
    scene.tweens.add({
      targets: cat,
      x: cat.x + options.wander,
      duration: 2600 + delay,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });
  }
  return cat;
}

export function catFrameForLevel(levelId) {
  return Math.max(0, (Number(levelId) || 1) - 1);
}
