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
  const texture = resolveVisualTexture(scene, look, previewFallbackTexture(look));
  const frame = texture === look.texture ? look.frame : 0;
  const image = scene.add.image(0, 0, texture, frame);
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

export function applyGrannySkin(granny, skinId) {
  const skin = visualItem(skinId);
  if (!granny?.active || skin?.kind !== "grannySkin") return null;
  granny.setTexture(resolveVisualTexture(granny.scene, skin, "granny-skate"), 0);
  granny.animationKey = resolveAnimationKey(granny.scene, skin, "granny-skating");
  return skin;
}

export function resolveVisualTexture(scene, look, fallbackTexture) {
  const texture = look?.texture || fallbackTexture;
  return scene?.textures?.exists(texture) ? texture : fallbackTexture;
}

export function resolveAnimationKey(scene, look, fallbackAnimation) {
  const animation = look?.animation || fallbackAnimation;
  return scene?.anims?.exists(animation) ? animation : fallbackAnimation;
}

function previewFallbackTexture(look) {
  if (look?.kind === "grannySkin") return "granny-skate";
  if (look?.kind === "thiefSkin") return "thief-run";
  return look?.texture || "__MISSING";
}

export function createGrannySkinEffect(scene, granny, skinId, options = {}) {
  const skin = visualItem(skinId);
  if (!scene || !granny?.active || skin?.kind !== "grannySkin") return null;
  const depthOffset = options.depthOffset ?? -1;
  const effect = scene.add.container(granny.x, granny.y).setDepth((granny.depth || 0) + depthOffset);
  const pieces = [];
  const scale = options.scale ?? 1;

  if (skin.effect === "sparkle") {
    for (let index = 0; index < 4; index += 1) {
      const star = scene.add.image(-58 + index * 34, -92 - (index % 2) * 18, "sparkle")
        .setScale(0.18 * scale)
        .setAlpha(0.72);
      effect.add(star);
      pieces.push(star);
      scene.tweens.add({
        targets: star,
        y: star.y - 16,
        angle: 120,
        alpha: 0.18,
        scale: star.scaleX * 1.45,
        duration: 740 + index * 120,
        yoyo: true,
        repeat: -1,
        delay: index * 150,
        ease: "Sine.inOut"
      });
    }
  } else if (skin.effect === "streak") {
    [0x41b9ad, 0xffdc61, 0xffffff].forEach((color, index) => {
      const streak = scene.add.rectangle(-70 - index * 18, 126 + index * 9, 58 - index * 10, 7, color, 0.58 - index * 0.12);
      streak.setAngle(-9);
      effect.add(streak);
      pieces.push(streak);
      scene.tweens.add({ targets: streak, x: streak.x - 34, alpha: 0.08, duration: 280 + index * 70, yoyo: true, repeat: -1 });
    });
  } else if (skin.effect === "bolt") {
    [-1, 1].forEach((side, index) => {
      const bolt = scene.add.text(side * 62, -58 + index * 42, "⚡", {
        fontFamily: "Arial",
        fontSize: `${Math.round(28 * scale)}px`,
        color: "#ffdc61",
        stroke: "#2f2335",
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0.82);
      effect.add(bolt);
      pieces.push(bolt);
      scene.tweens.add({ targets: bolt, angle: side * 15, scale: 1.2, alpha: 0.22, duration: 360, yoyo: true, repeat: -1, delay: index * 130 });
    });
  } else if (skin.effect === "royal") {
    const glint = scene.add.image(26, -154, "sparkle").setScale(0.28 * scale).setAlpha(0.9);
    const shine = scene.add.ellipse(0, -18, 150, 210, 0xffdc61, 0.08);
    effect.add([shine, glint]);
    pieces.push(shine, glint);
    scene.tweens.add({ targets: glint, angle: 180, scale: glint.scaleX * 1.35, alpha: 0.25, duration: 820, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: shine, scaleX: 1.08, alpha: 0.16, duration: 1120, yoyo: true, repeat: -1 });
  } else {
    const dust = scene.add.ellipse(-46, 140, 58, 14, VISUAL_RULES.shadowColor, 0.12);
    effect.add(dust);
    pieces.push(dust);
    scene.tweens.add({ targets: dust, scaleX: 1.18, alpha: 0.04, duration: 520, yoyo: true, repeat: -1 });
  }

  const update = () => {
    if (!granny.active || !effect.active) return;
    effect.setPosition(granny.x, granny.y);
    effect.setDepth((granny.depth || 0) + depthOffset);
    effect.setScale(Math.sign(granny.scaleX || 1), 1);
    effect.setAngle(granny.angle * 0.2);
    effect.setVisible(granny.visible);
    effect.setAlpha(granny.alpha);
  };
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    scene.events.off("update", update);
    pieces.forEach((piece) => scene.tweens.killTweensOf(piece));
  };
  scene.events.on("update", update);
  effect.once("destroy", cleanup);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    cleanup();
    if (effect.active) effect.destroy();
  });
  update();
  return effect;
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
