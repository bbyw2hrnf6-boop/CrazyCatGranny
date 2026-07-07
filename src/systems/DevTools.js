export class DevTools {
  constructor(scene) {
    this.scene = scene;
    this.visible = new URLSearchParams(location.search).has("debug");
    this.slowMotion = false;
    this.hitboxes = false;
    this.overlay = scene.add.text(18, 118, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#1b1322dd",
      padding: { x: 10, y: 8 }
    }).setScrollFactor(0).setDepth(200).setVisible(this.visible);
    this.help = scene.add.text(18, 222, "F1 UI · F2 HITBOX · F3 SLOW · F4 SKIP SEGMENT", {
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
    this.overlay.setText([
      `FPS ${this.scene.game.loop.actualFps.toFixed(1)}  QUALITY ${this.scene.performance.mode}`,
      `LEVEL ${this.scene.level.id}  X ${Math.round(granny.x)}  SPEED ${Math.round(granny.body.velocity.x)}`,
      `STATE ${granny.isSwinging ? "SWING" : granny.body.blocked.down ? "GROUND" : "AIR"}  FALLS ${this.scene.falls}`,
      `THIEF +${Math.round(this.scene.thiefProgress - granny.x)}  SEGMENT ${Math.floor(granny.x / 620)}`
    ]);
  }

  destroy() {
    if (this.slowMotion) this.setTimeScale(1);
    this.overlay.destroy();
    this.help.destroy();
  }
}
