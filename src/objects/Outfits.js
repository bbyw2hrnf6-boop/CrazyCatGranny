const GEAR_LOOK = {
  helmetBoost: { texture: "helmet", x: 0, y: -48, scale: 0.56, angle: 0 },
  bananaBoost: { texture: "banana", x: 34, y: 14, scale: 0.46, angle: -18 },
  magnetBoost: { texture: "magnet", x: 35, y: 7, scale: 0.42, angle: 12 },
  yarnBoost: { texture: "yarn", x: 34, y: 5, scale: 0.42, angle: 0 }
};

export function addGrannyGear(scene, granny, gearId, depth = 14) {
  const look = GEAR_LOOK[gearId];
  if (!look) return null;
  const visual = scene.add.image(granny.x, granny.y, look.texture)
    .setScale(look.scale)
    .setDepth(depth);
  visual.setData("gearLook", look);
  syncGrannyGear(visual, granny);
  return visual;
}

export function syncGrannyGear(visual, granny) {
  if (!visual?.active || !granny?.active) return;
  const look = visual.getData("gearLook");
  const radians = Phaser.Math.DegToRad(granny.angle);
  const x = look.x * Math.cos(radians) - look.y * Math.sin(radians);
  const y = look.x * Math.sin(radians) + look.y * Math.cos(radians);
  visual.setPosition(granny.x + x, granny.y + y);
  visual.setAngle(granny.angle + look.angle);
}
