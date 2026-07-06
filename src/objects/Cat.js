export const CAT_FRAME_SIZE = 418;

export function addDetailedCat(scene, x, y, frame = 0, scale = 0.25) {
  const world = Phaser.Math.Clamp(Math.floor(frame / 9) + 1, 1, 5);
  return scene.add.image(x, y, `cat-real-${world}`, frame % 9).setScale(scale);
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
