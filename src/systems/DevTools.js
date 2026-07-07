export class DevTools {
  constructor(scene) {
    this.scene = scene;
    this.visible = new URLSearchParams(location.search).has("debug");
    this.slowMotion = false;
    this.hitboxes = false;
    this.flags = {};
    this.guide = scene.add.graphics().setScrollFactor(0).setDepth(199);
    this.overlay = scene.add.text(18, 118, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#1b1322dd",
      padding: { x: 10, y: 8 }
    }).setScrollFactor(0).setDepth(200).setVisible(this.visible);
    this.help = scene.add.text(18, 222, "Admin Debug View active. F1-F4 are optional shortcuts.", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffdc61",
      backgroundColor: "#1b1322cc",
      padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(200).setVisible(this.visible);
    this.bind();
  }

  bind() {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;
    this.keys = keyboard.addKeys({
      overlay: Phaser.Input.Keyboard.KeyCodes.F1,
      hitboxes: Phaser.Input.Keyboard.KeyCodes.F2,
      slow: Phaser.Input.Keyboard.KeyCodes.F3,
      skip: Phaser.Input.Keyboard.KeyCodes.F4
    });
    this.keys.overlay.on("down", () => this.setVisible(!this.visible));
    this.keys.hitboxes.on("down", () => this.toggleHitboxes());
    this.keys.slow.on("down", () => this.toggleSlowMotion());
    this.keys.skip.on("down", () => this.skipSegment());
  }

  setVisible(visible) {
    this.visible = visible;
    this.overlay.setVisible(visible);
    this.help.setVisible(visible);
    this.guide.setVisible(visible);
  }

  setFlags(flags = {}) {
    this.flags = { ...flags };
    if (flags.stats || flags.grapple || flags.obstacles || flags.boss) this.setVisible(true);
  }

  toggleHitboxes() {
    this.hitboxes = !this.hitboxes;
    const world = this.scene.physics.world;
    if (!world.debugGraphic) world.createDebugGraphic();
    world.drawDebug = this.hitboxes;
    world.debugGraphic.setVisible(this.hitboxes);
    this.setVisible(true);
  }

  toggleSlowMotion() {
    this.setTimeScale(this.slowMotion ? 1 : 0.35);
  }

  setTimeScale(scale = 1) {
    scale = Phaser.Math.Clamp(Number(scale) || 1, 0.1, 1);
    this.slowMotion = scale < 1;
    this.scene.time.timeScale = scale;
    this.scene.tweens.timeScale = scale;
    this.scene.anims.globalTimeScale = scale;
    this.scene.physics.world.timeScale = 1 / scale;
    this.setVisible(true);
  }

  skipSegment() {
    const granny = this.scene.granny;
    if (!granny || this.scene.finished) return;
    granny.setPosition(Math.min(this.scene.finishX - 120, granny.x + 720), 440);
    granny.setVelocity(this.scene.granny.runSpeed, 0);
    this.setVisible(true);
  }

  update() {
    if (!this.visible) return;
    const granny = this.scene.granny;
    const thiefGap = Math.round(this.scene.thiefProgress - granny.x);
    this.overlay.setText([
      `FPS ${this.scene.game.loop.actualFps.toFixed(1)}  QUALITY ${this.scene.performance.mode}  SEED L${this.scene.level.id}-${this.scene.level.gimmick}`,
      `LEVEL ${this.scene.level.id}  X ${Math.round(granny.x)}  SPEED ${Math.round(granny.body.velocity.x)}`,
      `STATE ${granny.isSwinging ? "SWING" : granny.body.blocked.down ? "GROUND" : "AIR"}  FALLS ${this.scene.falls}`,
      `THIEF +${thiefGap}  THIEF SPEED ${Math.round(this.scene.thiefSpeed || 0)}  SEGMENT ${Math.floor(granny.x / 620)}`
    ]);
    this.drawGuides();
  }

  drawGuides() {
    const camera = this.scene.cameras.main;
    this.guide.clear();
    if (this.flags.grapple) {
      this.guide.lineStyle(2, 0xffdc63, 0.7);
      this.scene.hooks?.getChildren().forEach((hook) => {
        this.guide.strokeCircle(hook.x - camera.scrollX, hook.y - camera.scrollY, hook.getData("required") ? 245 : 190);
        this.guide.fillStyle(hook.getData("required") ? 0xffdc63 : 0x9ff3e6, 0.28).fillCircle(hook.x - camera.scrollX, hook.y - camera.scrollY, 7);
      });
      this.scene.courseGaps?.forEach(([start, end, required]) => {
        if (!required) return;
        this.guide.fillStyle(0xffdc63, 0.12).fillRect(start - camera.scrollX, 285 - camera.scrollY, end - start, 265);
      });
    }
    if (this.flags.obstacles) {
      this.guide.lineStyle(3, 0xec5966, 0.8);
      this.scene.breakables?.getChildren().forEach((object) => {
        if (!object.active) return;
        const body = object.body;
        this.guide.strokeRect(body.x - camera.scrollX, body.y - camera.scrollY, body.width, body.height);
      });
    }
    if (this.flags.boss && this.scene.activeWeakPoint?.active) {
      const weak = this.scene.activeWeakPoint;
      this.guide.lineStyle(4, 0xff6e9f, 0.9).strokeCircle(weak.x - camera.scrollX, weak.y - camera.scrollY, 38);
    }
  }

  destroy() {
    if (this.slowMotion) this.setTimeScale(1);
    this.guide.destroy();
    this.overlay.destroy();
    this.help.destroy();
  }
}
