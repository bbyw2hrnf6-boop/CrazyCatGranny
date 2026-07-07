import { bossDefinitionForWorld } from "../../content/bosses/BossDefinitions.js";
import { COLORS, sound, textStyle } from "../../ui/ui.js";

export class BossEncounter {
  constructor(scene) {
    this.scene = scene;
    this.definition = bossDefinitionForWorld(scene.level.world);
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
    const parts = [
      scene.add.ellipse(0, 15, 190, 125, this.definition.color).setStrokeStyle(8, COLORS.ink),
      scene.add.circle(-42, -5, 20, 0xfff3d0).setStrokeStyle(5, COLORS.ink),
      scene.add.circle(42, -5, 20, 0xfff3d0).setStrokeStyle(5, COLORS.ink),
      scene.add.circle(-42, -5, 7, 0x2f2335),
      scene.add.circle(42, -5, 7, 0x2f2335),
      scene.add.rectangle(0, 48, 88, 18, 0x34293a).setStrokeStyle(3, 0xffd45f)
    ];
    if (this.definition.visualVariant === "windmill") {
      const bladeA = scene.add.rectangle(0, -80, 14, 170, 0xfff1d3);
      const bladeB = scene.add.rectangle(0, -80, 14, 170, 0xfff1d3).setAngle(90);
      const hub = scene.add.circle(0, -80, 20, 0xf0b944).setStrokeStyle(5, COLORS.ink);
      scene.tweens.add({ targets: [bladeA, bladeB], angle: "+=360", duration: 1800, repeat: -1 });
      parts.unshift(bladeA, bladeB, hub);
    } else if (this.definition.visualVariant === "dragon") {
      parts.push(scene.add.triangle(-88, 0, 0, 20, 45, -45, 70, 35, 0xe9c24e));
      parts.push(scene.add.triangle(88, 0, 0, 20, -45, -45, -70, 35, 0xe9c24e));
    } else if (this.definition.visualVariant === "rocket") {
      parts.push(scene.add.triangle(0, -95, -45, 20, 0, -65, 45, 20, 0xe9eef0));
      parts.push(scene.add.triangle(0, 95, -30, -15, 0, 50, 30, -15, 0xffc84e));
    } else if (this.definition.visualVariant === "maestro") {
      parts.push(scene.add.rectangle(0, -82, 100, 30, 0x33243d));
      parts.push(scene.add.rectangle(0, -120, 70, 75, 0x33243d));
      parts.push(scene.add.text(0, 82, "♫", textStyle(36, "#ffdc63")).setOrigin(0.5));
    }
    scene.bossVisual = scene.add.container(scene.bossPhasePositions[0] + 250, 320, parts)
      .setDepth(20)
      .setScale(0.7)
      .setAlpha(0);
    scene.tweens.add({ targets: scene.bossVisual, scale: 1, alpha: 1, duration: 520, ease: "Back.out" });
    scene.tweens.add({ targets: scene.bossVisual, y: 300, angle: 2.5, duration: 620, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    scene.bossName = scene.add.text(scene.bossVisual.x, 205, this.title(), textStyle(18, "#fff7df"))
      .setOrigin(0.5).setDepth(22).setBackgroundColor("#3b2c40").setPadding(12, 5);
    const warning = scene.add.text(scene.bossVisual.x, 140, "BOSS FIGHT!", textStyle(28, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(29)
      .setBackgroundColor("#ec5966dd")
      .setPadding(18, 6);
    sound(scene, "hiss");
    scene.tweens.add({
      targets: warning,
      y: 112,
      scale: 1.08,
      alpha: 0,
      duration: 1000,
      delay: 520,
      ease: "Sine.in",
      onComplete: () => warning.destroy()
    });
    this.spawnWeakPoint();
  }

  title() {
    return this.definition.title;
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
    scene.bossHealthText?.setText(`BOSS  ${"♥ ".repeat(scene.bossHealth)}${"· ".repeat(3 - scene.bossHealth)}`);
    scene.cameras.main.shake(260, 0.013);
    sound(scene, "boss");
    scene.tweens.add({
      targets: scene.bossVisual,
      x: scene.bossVisual.x + 80,
      angle: 14,
      scale: 0.82,
      duration: 110,
      yoyo: true,
      ease: "Back.out"
    });
    for (let i = 0; i < scene.performance.bossSparks; i += 1) {
      const spark = scene.add.image(weak.x, weak.y, "sparkle").setScale(Phaser.Math.FloatBetween(0.2, 0.55)).setDepth(25);
      scene.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-120, 120),
        y: spark.y + Phaser.Math.Between(-100, 80),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(350, 700),
        onComplete: () => spark.destroy()
      });
    }
    if (scene.bossHealth > 0) this.spawnWeakPoint();
    else {
      scene.bossHealthText?.setText("BOSS  DEFEATED!");
      scene.tweens.add({
        targets: [scene.bossVisual, scene.bossName],
        y: 780,
        angle: 35,
        alpha: 0,
        duration: 1100,
        ease: "Quad.in"
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
    scene.bossName.x = scene.bossVisual.x;
    if (scene.time.now >= scene.nextBossAttack && scene.bossVisual.x - scene.granny.x < 900) {
      scene.nextBossAttack = scene.time.now + Math.max(900, 2100 - scene.bossPhase * 320);
      const texture = this.definition.projectileTexture;
      const projectile = scene.bossProjectiles.create(scene.bossVisual.x - 80, 480 - (scene.bossPhase % 2) * 105, texture)
        .setScale(texture === "crate" ? 0.58 : 0.48);
      projectile.body.setAllowGravity(false);
      projectile.setVelocityX(-260 - scene.bossPhase * 45);
      projectile.setAngularVelocity(scene.bossPhase % 2 ? -210 : 210);
      scene.time.delayedCall(4200, () => projectile?.destroy());
      const warning = scene.add.text(scene.granny.x + 430, 250, "!", textStyle(34, "#fff7df"))
        .setOrigin(0.5).setDepth(28).setBackgroundColor("#ec5966").setPadding(10, 2);
      scene.tweens.add({ targets: warning, y: 230, alpha: 0, duration: 600, onComplete: () => warning.destroy() });
    }
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
