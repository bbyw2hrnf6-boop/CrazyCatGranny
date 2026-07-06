export function addCoin(scene, x, y, group) {
  const coin = group.create(x, y, "coin");
  coin.setScale(0.65);
  coin.body.setAllowGravity(false);
  coin.body.setImmovable(true);
  scene.tweens.add({ targets: coin, y: y - 8, duration: 520, yoyo: true, repeat: -1, delay: (x % 5) * 40 });
  return coin;
}

export function addTreat(scene, x, y, group) {
  const treat = group.create(x, y, "treat");
  treat.setScale(0.72);
  treat.body.setAllowGravity(false);
  treat.body.setImmovable(true);
  scene.tweens.add({ targets: treat, angle: 8, scaleX: 0.78, scaleY: 0.78, duration: 700, yoyo: true, repeat: -1 });
  return treat;
}
