import { bossDefinitionForWorld } from "../../content/bosses/BossDefinitions.js";
import { COLORS, sound, textStyle } from "../../ui/ui.js";

const HIT_DEPTH = 25;

export class BossEncounter {
  constructor(scene) {
    this.scene = scene;
    this.definition = bossDefinitionForWorld(scene.level.world);
    this.attackIndex = 0;
    this.partsByRole = new Map();
    this.lastTrailAt = 0;
  }

  create() {
    const scene = this.scene;
    scene.bossHealth = this.definition.health;
    scene.bossPhase = 0;
    scene.nextBossAttack = scene.time.now + 1800;
    scene.bossWeakPoints = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.bossProjectiles = scene.physics.add.group({ allowGravity: false });
    scene.physics.add.overlap(scene.granny, scene.bossWeakPoints, this.hitBoss, undefined, this);
    scene.physics.add.overlap(scene.granny, scene.bossProjectiles, this.hitByBoss, undefined, this);
    scene.bossPhasePositions = this.definition.phasePositions.map((ratio) => Math.round(scene.level.length * ratio));

    const parts = this.definition.bodyParts.map((part) => this.createPart(part));
    scene.bossVisual = scene.add.container(scene.bossPhasePositions[0] + 250, 320, parts)
      .setDepth(20)
      .setScale(0.7)
      .setAlpha(0);
    this.createSetPiece();
    this.animateBoss(parts);

    scene.tweens.add({ targets: scene.bossVisual, scale: 1, alpha: 1, duration: 520, ease: "Back.out" });
    scene.bossName = scene.add.text(scene.bossVisual.x, 205, this.title(), textStyle(18, "#fff7df"))
      .setOrigin(0.5).setDepth(22).setBackgroundColor("#3b2c40").setPadding(12, 5);
    this.showBanner("BOSS FIGHT!", 28, 1000);
    sound(scene, "hiss");
    this.spawnWeakPoint();
  }

  createPart(part) {
    const scene = this.scene;
    let object;
    if (part.type === "ellipse") object = scene.add.ellipse(part.x, part.y, part.width, part.height, part.color);
    else if (part.type === "circle") object = scene.add.circle(part.x, part.y, part.radius, part.color);
    else if (part.type === "rect") object = scene.add.rectangle(part.x, part.y, part.width, part.height, part.color);
    else if (part.type === "triangle") object = scene.add.triangle(part.x, part.y, ...part.points, part.color);
    else if (part.type === "text") object = scene.add.text(part.x, part.y, part.text, textStyle(part.size, part.color)).setOrigin(0.5);
    else object = scene.add.circle(part.x || 0, part.y || 0, 24, part.color || this.definition.color);
    if (part.stroke && object.setStrokeStyle) object.setStrokeStyle(part.stroke, COLORS.ink);
    if (part.angle) object.setAngle(part.angle);
    if (part.role) {
      if (!this.partsByRole.has(part.role)) this.partsByRole.set(part.role, []);
      this.partsByRole.get(part.role).push(object);
    }
    return object;
  }

  animateBoss() {
    const scene = this.scene;
    const idle = this.definition.idleAnimation || {};
    scene.tweens.add({
      targets: scene.bossVisual,
      y: 300,
      angle: idle.tilt || 2.5,
      duration: idle.bobMs || 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut"
    });
    if (idle.spinRole) {
      scene.tweens.add({
        targets: this.partsByRole.get(idle.spinRole) || [],
        angle: "+=360",
        duration: idle.spinMs || 1400,
        repeat: -1,
        ease: "Linear"
      });
    }
    if (idle.pulseRole) {
      scene.tweens.add({
        targets: this.partsByRole.get(idle.pulseRole) || [],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    }
    if (idle.swingRole) {
      scene.tweens.add({
        targets: this.partsByRole.get(idle.swingRole) || [],
        angle: "+=32",
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    }
  }

  createSetPiece() {
    const scene = this.scene;
    const setPiece = this.definition.phaseSetPiece;
    if (!setPiece) return;
    if (setPiece.type === "spotlights") {
      this.setPieceParts = [-1, 1].map((side) => {
        const cone = scene.add.triangle(scene.bossPhasePositions[0] + side * 190, 430, 0, -240, side * 95, 170, side * -95, 170, setPiece.color, 0.12)
          .setDepth(5);
        scene.tweens.add({ targets: cone, angle: side * 18, alpha: 0.24, duration: 720, yoyo: true, repeat: -1 });
        return cone;
      });
    } else {
      this.setPieceParts = Array.from({ length: 5 }, (_, index) => {
        const x = scene.bossPhasePositions[0] + index * 78 - 150;
        const detail = scene.add.rectangle(x, 568, 60, 9, setPiece.color, 0.18).setDepth(5);
        scene.tweens.add({ targets: detail, y: 554, alpha: 0.35, duration: 500 + index * 70, yoyo: true, repeat: -1 });
        return detail;
      });
    }
  }

  title() {
    return this.definition.title;
  }

  showBanner(copy, size = 24, duration = 720, x = this.scene.bossVisual?.x || 640) {
    const scene = this.scene;
    const label = scene.add.text(x, 140, copy, textStyle(size, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(29)
      .setBackgroundColor("#ec5966dd")
      .setPadding(18, 6);
    scene.tweens.add({
      targets: label,
      y: 112,
      scale: 1.08,
      alpha: 0,
      duration,
      delay: 180,
      ease: "Sine.in",
      onComplete: () => label.destroy()
    });
  }

  spawnWeakPoint() {
    const scene = this.scene;
    const x = scene.bossPhasePositions[scene.bossPhase] || scene.level.length - 250;
    const y = this.definition.weakPointY[scene.bossPhase] || 460;
    const weak = scene.bossWeakPoints.create(x, y, "sparkle").setScale(1.8);
    weak.body.setAllowGravity(false);
    weak.body.setImmovable(true);
    weak.setData("phase", scene.bossPhase);
    scene.activeWeakPoint = weak;
    scene.tweens.add({ targets: weak, scale: 2.35, angle: 180, duration: 520, yoyo: true, repeat: -1 });
  }

  hitBoss(_granny, weak) {
    const scene = this.scene;
    if (!weak.active || scene.finished) return;
    weak.disableBody(true, true);
    scene.bossHealth -= 1;
    scene.bossPhase += 1;
    scene.bossHealthText?.setText(`BOSS  ${"♥ ".repeat(scene.bossHealth)}${"· ".repeat(this.definition.health - scene.bossHealth)}`);
    scene.cameras.main.shake(280, 0.014);
    sound(scene, "boss");
    this.phaseBurst(weak.x, weak.y);
    scene.tweens.add({
      targets: scene.bossVisual,
      x: scene.bossVisual.x + 80,
      angle: 14,
      scale: 0.82,
      duration: 110,
      yoyo: true,
      ease: "Back.out"
    });
    if (scene.bossHealth > 0) {
      this.showBanner(this.definition.telegraph?.copy || "PHASE UP", 22, 700, weak.x);
      this.spawnWeakPoint();
    } else {
      scene.bossHealthText?.setText("BOSS  DEFEATED!");
      scene.tweens.add({
        targets: [scene.bossVisual, scene.bossName, ...(this.setPieceParts || [])],
        y: 780,
        angle: 35,
        alpha: 0,
        duration: 1100,
        ease: "Quad.in"
      });
    }
  }

  phaseBurst(x, y) {
    const scene = this.scene;
    for (let i = 0; i < scene.performance.bossSparks + 6; i += 1) {
      const spark = scene.add.image(x, y, "sparkle").setScale(Phaser.Math.FloatBetween(0.2, 0.62)).setDepth(HIT_DEPTH);
      scene.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-150, 150),
        y: spark.y + Phaser.Math.Between(-120, 90),
        alpha: 0,
        angle: Phaser.Math.Between(-220, 220),
        duration: Phaser.Math.Between(350, 760),
        onComplete: () => spark.destroy()
      });
    }
  }

  update() {
    const scene = this.scene;
    if (!scene.level.boss || !scene.bossVisual || scene.bossHealth <= 0) return;
    const weak = scene.activeWeakPoint;
    if (weak?.active && scene.granny.x > weak.x + 180) {
      weak.setPosition(Math.min(scene.level.length - 230, scene.granny.x + 300), 470 - scene.bossHealth * 25);
    }
    const targetX = (weak?.active ? weak.x : scene.granny.x + 350) + 230;
    scene.bossVisual.x = Phaser.Math.Linear(scene.bossVisual.x, targetX, 0.035);
    scene.bossName.setPosition(scene.bossVisual.x, scene.bossVisual.y - 95);
    (this.setPieceParts || []).forEach((part, index) => {
      part.x = Phaser.Math.Linear(part.x, scene.bossVisual.x + (index - 2) * 78, 0.04);
    });
    this.emitBossTrail();
    if (scene.time.now >= scene.nextBossAttack && scene.bossVisual.x - scene.granny.x < 940) this.attack();
  }

  attack() {
    const scene = this.scene;
    const pattern = this.definition.attackPattern || [];
    const attack = pattern[this.attackIndex % Math.max(1, pattern.length)] || { type: "projectile", interval: 1600, label: "ATTACK" };
    this.attackIndex += 1;
    scene.nextBossAttack = scene.time.now + Math.max(850, attack.interval - scene.bossPhase * 130);
    this.showAttackTelegraph(attack);
    this.flashBoss(attack.telegraphColor || this.definition.color);
    this.performAttack(attack);
  }

  showAttackTelegraph(attack) {
    const scene = this.scene;
    const mark = scene.add.text(scene.granny.x + 430, 250, attack.label || "!", textStyle(24, "#fff7df"))
      .setOrigin(0.5).setDepth(28).setBackgroundColor("#ec5966").setPadding(12, 4);
    scene.tweens.add({ targets: mark, y: 226, alpha: 0, duration: 680, onComplete: () => mark.destroy() });
  }

  flashBoss(color) {
    const scene = this.scene;
    const ring = scene.add.circle(scene.bossVisual.x, scene.bossVisual.y, 124, color, 0.24)
      .setStrokeStyle(5, color, 0.8)
      .setDepth(19);
    scene.tweens.add({ targets: ring, scale: 1.65, alpha: 0, duration: 460, onComplete: () => ring.destroy() });
  }

  performAttack(attack) {
    const handlers = {
      "vine-slam": () => this.spawnShockwave(0x4d7f43, 575, 48, -340, "roots"),
      "crate-burst": () => this.spawnProjectile(this.definition.projectileTexture, 470, -305, 0.52),
      "wind-gust": () => this.spawnGust(),
      "cart-toss": () => this.spawnProjectile(this.definition.projectileTexture, 425, -330, 0.46),
      "neon-breath": () => this.spawnBreath(),
      "lantern-wave": () => this.spawnProjectile(this.definition.projectileTexture, 450, -315, 0.44),
      "sign-salve": () => this.spawnSignSalve(),
      "dive-bomb": () => this.diveBomb(),
      "shockwave": () => this.spawnShockwave(0xd06749, 585, 55, -380, "shock"),
      "note-wave": () => this.spawnNoteWave(),
      "drum-roll": () => this.spawnProjectile("carnival-drum", 500, -360, 0.58),
      "spotlight": () => this.spawnSpotlight(),
      "crescendo": () => this.spawnCrescendo()
    };
    (handlers[attack.type] || (() => this.spawnProjectile(this.definition.projectileTexture, 470, -300, 0.5)))();
  }

  spawnProjectile(texture, y, speed, scale = 0.5) {
    const scene = this.scene;
    const projectile = scene.bossProjectiles.create(scene.bossVisual.x - 80, y - (scene.bossPhase % 2) * 60, texture)
      .setScale(scale)
      .setDepth(HIT_DEPTH);
    projectile.body.setAllowGravity(false);
    projectile.setVelocityX(speed - scene.bossPhase * 40);
    projectile.setAngularVelocity(scene.bossPhase % 2 ? -230 : 230);
    scene.time.delayedCall(4200, () => projectile?.destroy());
    return projectile;
  }

  addPhysicsHazard(object, speed, ttl = 3600) {
    const scene = this.scene;
    scene.physics.add.existing(object);
    object.body.setAllowGravity(false);
    object.body.setImmovable(true);
    object.body.setVelocityX(speed);
    scene.bossProjectiles.add(object);
    scene.time.delayedCall(ttl, () => object?.destroy());
    return object;
  }

  spawnShockwave(color, y, height, speed, label = "!") {
    const scene = this.scene;
    const wave = scene.add.rectangle(scene.bossVisual.x - 110, y, 190, height, color, 0.34)
      .setStrokeStyle(4, COLORS.ink, 0.7)
      .setDepth(HIT_DEPTH);
    wave.setData("impact", label);
    this.addPhysicsHazard(wave, speed, 3000);
    scene.tweens.add({ targets: wave, scaleY: 1.28, alpha: 0.68, duration: 180, yoyo: true, repeat: -1 });
  }

  spawnGust() {
    const scene = this.scene;
    for (let lane = 0; lane < 3; lane += 1) {
      const gust = scene.add.rectangle(scene.bossVisual.x - 90, 388 + lane * 72, 220, 34, 0xbdefff, 0.24)
        .setStrokeStyle(3, 0x53a6b6, 0.85)
        .setDepth(HIT_DEPTH);
      this.addPhysicsHazard(gust, -320 - lane * 25, 3200);
      scene.tweens.add({ targets: gust, x: gust.x - 30, alpha: 0.48, duration: 180, yoyo: true, repeat: -1 });
    }
  }

  spawnBreath() {
    const scene = this.scene;
    for (let i = 0; i < 4; i += 1) {
      const breath = scene.add.rectangle(scene.bossVisual.x - 88 - i * 30, 418 + i * 18, 150, 26, 0xff6e9f, 0.3)
        .setStrokeStyle(3, 0xffdc63, 0.75)
        .setDepth(HIT_DEPTH);
      this.addPhysicsHazard(breath, -330 - i * 18, 2800);
      scene.tweens.add({ targets: breath, scaleX: 1.24, alpha: 0.52, duration: 170, yoyo: true, repeat: -1 });
    }
  }

  spawnSignSalve() {
    [430, 505, 360].forEach((y, index) => {
      this.scene.time.delayedCall(index * 170, () => this.spawnProjectile("road-barrier", y, -370 - index * 35, 0.5));
    });
  }

  diveBomb() {
    const scene = this.scene;
    const startY = scene.bossVisual.y;
    scene.tweens.add({
      targets: scene.bossVisual,
      y: 500,
      angle: -18,
      duration: 220,
      yoyo: true,
      ease: "Quad.in",
      onYoyo: () => this.spawnShockwave(0xec5966, 585, 48, -420, "dive")
    });
    scene.time.delayedCall(520, () => {
      if (scene.bossVisual?.active !== false) scene.bossVisual.y = Math.min(scene.bossVisual.y, startY);
    });
  }

  spawnNoteWave() {
    const scene = this.scene;
    ["♪", "♫", "♬"].forEach((note, index) => {
      const text = scene.add.text(scene.bossVisual.x - 90, 395 + index * 58, note, textStyle(34, "#ffdc63"))
        .setOrigin(0.5)
        .setDepth(HIT_DEPTH);
      this.addPhysicsHazard(text, -330 - index * 30, 3400);
      scene.tweens.add({ targets: text, angle: 180, y: text.y + 18, duration: 460, yoyo: true, repeat: -1 });
    });
  }

  spawnSpotlight() {
    const scene = this.scene;
    const x = scene.granny.x + 300;
    const beam = scene.add.rectangle(x, 520, 140, 185, 0xbdefff, 0.18)
      .setStrokeStyle(5, 0xffdc63, 0.75)
      .setDepth(HIT_DEPTH);
    this.addPhysicsHazard(beam, -170, 2400);
    scene.tweens.add({ targets: beam, alpha: 0.46, scaleX: 0.82, duration: 240, yoyo: true, repeat: -1 });
  }

  spawnCrescendo() {
    this.spawnNoteWave();
    this.scene.time.delayedCall(280, () => this.spawnShockwave(0xff6e9f, 585, 45, -430, "crescendo"));
    this.scene.time.delayedCall(560, () => this.spawnProjectile("carnival-drum", 438, -390, 0.55));
  }

  emitBossTrail() {
    const scene = this.scene;
    if (this.definition.id !== "rocket-bandit" || scene.time.now - this.lastTrailAt < 120) return;
    this.lastTrailAt = scene.time.now;
    const puff = scene.add.circle(scene.bossVisual.x + 5, scene.bossVisual.y + 106, Phaser.Math.Between(6, 12), 0xe9eef0, 0.24)
      .setDepth(18);
    scene.tweens.add({
      targets: puff,
      x: puff.x + Phaser.Math.Between(-35, 35),
      y: puff.y + Phaser.Math.Between(25, 55),
      scale: 1.8,
      alpha: 0,
      duration: 520,
      onComplete: () => puff.destroy()
    });
  }

  hitByBoss(_granny, projectile) {
    const scene = this.scene;
    if (!projectile.active) return;
    projectile.destroy();
    scene.falls += 1;
    if (scene.falls >= scene.maxFalls) {
      scene.lose("falls");
      return;
    }
    scene.granny.setVelocity(scene.granny.runSpeed * 0.55, -330);
    scene.cameras.main.shake(220, 0.011);
    scene.cameras.main.flash(120, 236, 89, 102);
    sound(scene, "crash");
  }
}
