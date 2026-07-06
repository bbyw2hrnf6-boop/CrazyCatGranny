import {
  HOME_ITEMS,
  VISUAL_RULES,
  catVisual,
  visualItem
} from "./VisualCatalog.js";

export function createCat(scene, x, y, frame = 0, scale = 0.25) {
  const look = catVisual(frame);
  return scene.add.image(x, y, look.texture, look.frame)
    .setScale(scale)
    .setData("visualKind", "cat")
    .setData("catFrame", look.globalFrame)
    .setData("anchors", look.anchors);
}

export function catHeadAnchor(frame = 0) {
  return catVisual(frame).anchors.head;
}

export function attachCatAccessory(scene, cat, itemId, depth = cat.depth + 1) {
  const look = visualItem(itemId);
  if (!look || look.kind !== "hat") return null;
  const accessory = scene.add.image(cat.x, cat.y, look.texture, look.frame)
    .setOrigin(0.5, look.originY)
    .setDepth(depth)
    .setData("visualKind", "cat-accessory")
    .setData("itemId", itemId);
  syncCatAccessory(cat, accessory);
  return accessory;
}

export function syncCatAccessory(cat, accessory) {
  if (!cat?.active || !accessory?.active) return;
  const look = visualItem(accessory.getData("itemId"));
  if (!look) return;
  const anchor = cat.getData("anchors")?.head || { x: -75, y: -140 };
  const direction = cat.flipX ? -1 : 1;
  const scaleX = Math.abs(cat.scaleX);
  const scaleY = Math.abs(cat.scaleY);
  accessory.setPosition(
    cat.x + (anchor.x + (look.offsetX || 0)) * scaleX * direction,
    cat.y + (anchor.y + (look.offsetY || 0)) * scaleY
  );
  accessory.setScale(scaleX * look.attachScale, scaleY * look.attachScale);
  accessory.setFlipX(cat.flipX);
  accessory.setAngle(cat.angle + (look.angle || 0) * direction);
  accessory.setAlpha(cat.alpha);
  accessory.setVisible(cat.visible);
  accessory.setDepth(cat.depth + 1);
  accessory.setScrollFactor(cat.scrollFactorX, cat.scrollFactorY);
}

export function animateCat(scene, cat, options = {}) {
  const baseY = cat.y;
  const delay = options.delay ?? (Number(cat.frame.name) % 5) * 90;
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

export function createItemPreview(scene, itemId, x, y, options = {}) {
  const look = visualItem(itemId);
  if (!look) return scene.add.container(x, y);
  const scale = (options.scale ?? 1) * look.previewScale;
  const image = scene.add.image(0, 0, look.texture, look.frame);
  if (look.kind === "hat") image.setOrigin(0.5, look.originY);
  image.setScale(scale);
  const boundsWidth = Math.max(56, image.displayWidth * 0.72);
  const shadowY = look.kind === "furniture" ? image.displayHeight * 0.38 : image.displayHeight * 0.3;
  const shadow = scene.add.ellipse(
    0,
    shadowY,
    boundsWidth,
    Math.max(8, boundsWidth * 0.16),
    VISUAL_RULES.shadowColor,
    VISUAL_RULES.shadowAlpha
  );
  const preview = scene.add.container(x, y, [shadow, image])
    .setDepth(options.depth ?? VISUAL_RULES.previewDepth)
    .setSize(Math.max(70, image.displayWidth), Math.max(70, image.displayHeight))
    .setData("visualKind", "item-preview")
    .setData("itemId", itemId);
  return preview;
}

export function createFurniture(scene, itemId, options = {}) {
  const look = visualItem(itemId);
  if (!look || look.kind !== "furniture" || look.room.wallpaper) return null;
  const room = { ...look.room, ...options };
  const image = scene.add.image(0, 0, look.texture).setScale(room.scale);
  const shadow = room.wall
    ? null
    : scene.add.ellipse(0, image.displayHeight * 0.39, image.displayWidth * 0.72, Math.max(9, image.displayWidth * 0.1), VISUAL_RULES.shadowColor, 0.12);
  const children = shadow ? [shadow, image] : [image];
  return scene.add.container(room.x, room.y, children)
    .setDepth(room.depth ?? (room.wall ? -5 : -4))
    .setData("visualKind", "furniture")
    .setData("itemId", itemId);
}

export function createRoomDecor(scene, activeDecor = []) {
  const furniture = {};
  const perches = [];
  const wallpaper = activeDecor.includes("wallpaper")
    ? scene.add.tileSprite(790, 270, 980, 360, "room-wallpaper")
      .setTileScale(0.42)
      .setAlpha(0.28)
      .setDepth(-9)
      .setData("visualKind", "wallpaper")
      .setData("itemId", "wallpaper")
    : null;

  HOME_ITEMS.forEach((item) => {
    if (!activeDecor.includes(item.id) || item.room.wallpaper) return;
    const visual = createFurniture(scene, item.id);
    furniture[item.id] = visual;
    (item.room.perches || []).forEach((perch) => perches.push({ ...perch, furniture: item.id }));
  });
  return { furniture, perches, wallpaper };
}

export function createGrannyGear(scene, granny, gearId, depth = 14) {
  const look = visualItem(gearId);
  if (!look || look.kind !== "gear") return null;
  const visual = scene.add.image(granny.x, granny.y, look.texture, look.frame)
    .setOrigin(0.5)
    .setScale(look.granny.scale)
    .setDepth(depth)
    .setData("visualKind", "granny-gear")
    .setData("itemId", gearId)
    .setData("hostBaseScale", granny.baseScale || 0.29);
  syncGrannyGear(visual, granny);
  return visual;
}

export function syncGrannyGear(visual, granny) {
  if (!visual?.active || !granny?.active) return;
  const look = visualItem(visual.getData("itemId"));
  if (!look?.granny) return;
  const baseScale = visual.getData("hostBaseScale") || 0.29;
  const ratioX = Math.abs(granny.scaleX) / baseScale;
  const ratioY = Math.abs(granny.scaleY) / baseScale;
  const anchorScale = (ratioX + ratioY) * 0.5;
  const radians = Phaser.Math.DegToRad(granny.angle);
  const anchorX = look.granny.x * anchorScale;
  const anchorY = look.granny.y * anchorScale;
  const x = anchorX * Math.cos(radians) - anchorY * Math.sin(radians);
  const y = anchorX * Math.sin(radians) + anchorY * Math.cos(radians);
  visual.setPosition(granny.x + x, granny.y + y);
  visual.setScale(look.granny.scale * ratioX, look.granny.scale * ratioY);
  visual.setAngle(granny.angle + look.granny.angle);
  visual.setFlipX(granny.flipX);
  visual.setAlpha(granny.alpha);
  visual.setVisible(granny.visible);
  visual.setScrollFactor(granny.scrollFactorX, granny.scrollFactorY);
}
