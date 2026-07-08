import {
  GRANNY_GEAR_ANCHORS,
  HOME_ITEMS,
  VISUAL_RULES,
  catVisual,
  roomPosition,
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

export function attachCatAccessory(scene, cat, itemId, depth = cat.depth + 1, adjustment = null) {
  const look = visualItem(itemId);
  if (!look || look.kind !== "hat") return null;
  const accessory = scene.add.image(cat.x, cat.y, look.texture, look.frame)
    .setOrigin(0.5, look.originY)
    .setDepth(depth)
    .setData("visualKind", "cat-accessory")
    .setData("itemId", itemId)
    .setData("adjustment", normalizeAccessoryAdjustment(adjustment));
  syncCatAccessory(cat, accessory);
  return accessory;
}

export function syncCatAccessory(cat, accessory) {
  if (!cat?.active || !accessory?.active) return;
  const look = visualItem(accessory.getData("itemId"));
  if (!look) return;
  const anchors = cat.getData("anchors") || {};
  const anchor = anchors[look.anchor || "head"] || anchors.head || { x: -75, y: -140 };
  const direction = cat.flipX ? -1 : 1;
  const scaleX = Math.abs(cat.scaleX);
  const scaleY = Math.abs(cat.scaleY);
  const adjustment = normalizeAccessoryAdjustment(accessory.getData("adjustment"));
  const localX = (anchor.x + (look.offsetX || 0) + adjustment.x) * scaleX * direction;
  const localY = (anchor.y + (look.offsetY || 0) + adjustment.y) * scaleY;
  const angle = Phaser.Math.DegToRad(cat.angle || 0);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  accessory.setPosition(
    cat.x + localX * cosine - localY * sine,
    cat.y + localX * sine + localY * cosine
  );
  accessory.setScale(scaleX * look.attachScale * adjustment.scale, scaleY * look.attachScale * adjustment.scale);
  accessory.setFlipX(cat.flipX);
  accessory.setAngle(cat.angle + ((look.angle || 0) + adjustment.angle) * direction);
  if (adjustment.tint === null) accessory.clearTint();
  else accessory.setTint(adjustment.tint);
  accessory.setAlpha(cat.alpha);
  accessory.setVisible(cat.visible);
  accessory.setDepth(cat.depth + (look.depthOffset ?? 1));
  accessory.setScrollFactor(cat.scrollFactorX, cat.scrollFactorY);
}

export function setCatAccessoryAdjustment(accessory, adjustment = null) {
  if (!accessory?.active) return;
  accessory.setData("adjustment", normalizeAccessoryAdjustment(adjustment));
}

function normalizeAccessoryAdjustment(adjustment = {}) {
  const rawTint = adjustment?.tint;
  return {
    x: Math.round(Number(adjustment?.x) || 0),
    y: Math.round(Number(adjustment?.y) || 0),
    scale: Math.max(0.25, Math.min(3, Number(adjustment?.scale) || 1)),
    angle: Math.max(-90, Math.min(90, Math.round(Number(adjustment?.angle) || 0))),
    tint: rawTint === null || rawTint === undefined || rawTint === ""
      ? null
      : Math.max(0, Math.min(0xffffff, Math.round(Number(rawTint) || 0)))
  };
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
  if (look.tint) image.setTint(look.tint);
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
  const position = roomPosition(itemId, options);
  const room = { ...look.room, ...options, ...position };
  const image = scene.add.image(0, 0, look.texture).setScale(room.scale);
  const shadow = room.y < 450
    ? null
    : scene.add.ellipse(0, image.displayHeight * 0.39, image.displayWidth * 0.72, Math.max(9, image.displayWidth * 0.1), VISUAL_RULES.shadowColor, 0.12);
  const children = shadow ? [shadow, image] : [image];
  const normalDepth = room.y < 450 ? -5 : -4;
  return scene.add.container(room.x, room.y, children)
    .setSize(image.displayWidth, image.displayHeight)
    .setScale((room.flipX ? -1 : 1) * room.size, room.size)
    .setAngle(room.angle)
    .setDepth(room.depth ?? normalDepth)
    .setData("visualKind", "furniture")
    .setData("itemId", itemId)
    .setData("normalDepth", room.depth ?? normalDepth);
}

export function buildRoomPerches(activeDecor = [], decorPositions = {}) {
  const perches = [];
  HOME_ITEMS.forEach((item) => {
    if (!activeDecor.includes(item.id) || !item.room.perches) return;
    const position = roomPosition(item.id, decorPositions[item.id]);
    const transformPoint = roomTransform(item, position);
    item.room.perches.forEach((perch, perchIndex) => {
      const path = perch.path.map(([x, y], index) => {
        const point = transformPoint(x, y);
        return {
          x: point.x,
          y: index === 0 ? Math.max(535, Math.min(600, point.y)) : point.y,
          mode: index === 0 ? "walk" : "jump"
        };
      });
      const target = transformPoint(perch.x, perch.y);
      perches.push({
        id: `${item.id}-${perchIndex}`,
        x: target.x,
        y: target.y,
        path,
        furniture: item.id
      });
    });
  });
  return perches;
}

export function buildRoomInteractionAnchors(activeDecor = [], decorPositions = {}) {
  const anchors = [];
  HOME_ITEMS.forEach((item) => {
    if (!activeDecor.includes(item.id) || !item.room.anchors) return;
    const position = roomPosition(item.id, decorPositions[item.id]);
    const transformPoint = roomTransform(item, position);
    item.room.anchors.forEach((anchor, index) => {
      const point = transformPoint(anchor.x, anchor.y);
      anchors.push({
        id: `${item.id}-${anchor.type}-${index}`,
        type: anchor.type,
        furniture: item.id,
        x: point.x,
        y: point.y
      });
    });
  });
  return anchors;
}

function roomTransform(item, position) {
  const radians = position.angle * (Math.PI / 180);
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return (x, y) => {
    const localX = (x - item.room.x) * position.size * (position.flipX ? -1 : 1);
    const localY = (y - item.room.y) * position.size;
    return {
      x: Math.max(330, Math.min(1220, position.x + localX * cosine - localY * sine)),
      y: Math.max(145, Math.min(605, position.y + localX * sine + localY * cosine))
    };
  };
}

export function createRoomDecor(scene, activeDecor = [], decorPositions = {}) {
  const furniture = {};
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
    const visual = createFurniture(scene, item.id, decorPositions[item.id] || {});
    furniture[item.id] = visual;
  });
  return {
    furniture,
    perches: buildRoomPerches(activeDecor, decorPositions),
    anchors: buildRoomInteractionAnchors(activeDecor, decorPositions),
    wallpaper
  };
}

export function createGrannyGear(scene, granny, gearId, depth = 14, adjustment = null) {
  const look = visualItem(gearId);
  if (!look || look.kind !== "gear") return null;
  const visual = scene.add.image(granny.x, granny.y, look.texture, look.frame)
    .setOrigin(look.granny.originX ?? 0.5, look.granny.originY ?? 0.5)
    .setScale(look.granny.scale)
    .setDepth(depth)
    .setData("visualKind", "granny-gear")
    .setData("itemId", gearId)
    .setData("adjustment", normalizeGearAdjustment(adjustment))
    .setData("depthOffset", depth - (granny.depth || depth))
    .setData("hostBaseScale", granny.baseScale || 0.29);
  syncGrannyGear(visual, granny);
  return visual;
}

export function setGrannyGearAdjustment(visual, adjustment = null) {
  if (!visual?.active) return;
  visual.setData("adjustment", normalizeGearAdjustment(adjustment));
}

function currentGrannyFrame(granny) {
  const frameName = granny?.frame?.name;
  const numericFrame = Number(frameName);
  return Number.isFinite(numericFrame) ? numericFrame : 0;
}

function grannyGearAnchor(granny, look, adjustment) {
  const frame = currentGrannyFrame(granny);
  const anchorName = adjustment.anchor || look.granny.anchor || "torso";
  const frameAnchors = GRANNY_GEAR_ANCHORS[frame] || GRANNY_GEAR_ANCHORS.default;
  const base = GRANNY_GEAR_ANCHORS.default[anchorName] || GRANNY_GEAR_ANCHORS.default.torso;
  const itemFrameAnchors = look.granny.frameAnchors || {};
  return {
    ...base,
    ...(frameAnchors[anchorName] || {}),
    ...(itemFrameAnchors.default || {}),
    ...(itemFrameAnchors[frame] || {})
  };
}

export function syncGrannyGear(visual, granny) {
  if (!visual?.active || !granny?.active) return;
  const look = visualItem(visual.getData("itemId"));
  if (!look?.granny) return;
  const baseScale = visual.getData("hostBaseScale") || 0.29;
  const ratioX = Math.abs(granny.scaleX) / baseScale;
  const ratioY = Math.abs(granny.scaleY) / baseScale;
  const adjustment = normalizeGearAdjustment(visual.getData("adjustment"));
  const anchor = grannyGearAnchor(granny, look, adjustment);
  const flip = granny.flipX ? -1 : 1;
  const radians = Phaser.Math.DegToRad(granny.angle);
  const anchorX = (anchor.x + look.granny.x + adjustment.x) * Math.abs(granny.scaleX) * flip;
  const anchorY = (anchor.y + look.granny.y + adjustment.y) * Math.abs(granny.scaleY);
  const x = anchorX * Math.cos(radians) - anchorY * Math.sin(radians);
  const y = anchorX * Math.sin(radians) + anchorY * Math.cos(radians);
  visual.setPosition(granny.x + x, granny.y + y);
  visual.setScale(look.granny.scale * ratioX * anchor.scale * adjustment.scale, look.granny.scale * ratioY * anchor.scale * adjustment.scale);
  visual.setAngle(granny.angle + (anchor.angle + look.granny.angle + adjustment.angle) * flip);
  visual.setFlipX(granny.flipX);
  visual.setAlpha(granny.alpha);
  visual.setVisible(granny.visible);
  visual.setDepth((granny.depth || 0) + (visual.getData("depthOffset") ?? 1));
  visual.setScrollFactor(granny.scrollFactorX, granny.scrollFactorY);
}

function normalizeGearAdjustment(adjustment = {}) {
  return {
    anchor: ["head", "torso", "hand"].includes(adjustment?.anchor) ? adjustment.anchor : null,
    x: Math.round(Number(adjustment?.x) || 0),
    y: Math.round(Number(adjustment?.y) || 0),
    scale: Math.max(0.25, Math.min(3, Number(adjustment?.scale) || 1)),
    angle: Math.max(-120, Math.min(120, Math.round(Number(adjustment?.angle) || 0)))
  };
}
