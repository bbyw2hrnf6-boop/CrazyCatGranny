import { SaveGame } from "../savegame/SaveGame.js";
import { VISUAL_ASSETS } from "../visual/VisualCatalog.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    VISUAL_ASSETS.images.forEach(([key, path]) => this.load.image(key, path));
    VISUAL_ASSETS.sheets.forEach(([key, path, frameWidth, frameHeight]) => {
      this.load.spritesheet(key, path, { frameWidth, frameHeight });
    });
  }

  create() {
    this.makeTextures();
    this.makeAnimations();
    this.registry.set("save", SaveGame.load());
    this.scene.start("MainMenu");
  }

  makeAnimations() {
    this.anims.create({
      key: "granny-skating",
      frames: this.anims.generateFrameNumbers("granny-skate", { frames: [0, 1, 3, 1] }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: "thief-running",
      frames: this.anims.generateFrameNumbers("thief-run", { frames: [0, 1, 3, 2] }),
      frameRate: 8,
      repeat: -1
    });
  }

  makeTextures() {
    this.texture("coin", 56, 56, (g) => {
      g.fillStyle(0x7b4b20).fillCircle(28, 31, 22);
      g.fillStyle(0xffd34e).fillCircle(28, 27, 22);
      g.lineStyle(4, 0xffec8e).strokeCircle(28, 27, 15);
      g.fillStyle(0xd99124).fillCircle(28, 27, 5);
    });

    this.texture("treat", 70, 70, (g) => {
      g.fillStyle(0x6b3c2b).fillRoundedRect(8, 15, 54, 40, 17);
      g.fillStyle(0xd78a45).fillRoundedRect(8, 10, 54, 40, 17);
      g.fillStyle(0x6b3c2b).fillCircle(24, 28, 4).fillCircle(46, 28, 4);
      g.fillTriangle(29, 38, 41, 38, 35, 45);
    });

    this.texture("hook", 74, 74, (g) => {
      g.lineStyle(8, 0x6a3f27).beginPath().moveTo(37, 0).lineTo(37, 19).strokePath();
      g.fillStyle(0xffd452).fillCircle(37, 36, 18);
      g.lineStyle(7, 0xfff0a0).strokeCircle(37, 36, 12);
      g.lineStyle(6, 0x6a3f27).beginPath().moveTo(37, 52).arc(37, 52, 15, 0, Math.PI).strokePath();
    });

    this.texture("crate", 86, 86, (g) => {
      g.fillStyle(0x2f2530, 0.22).fillRoundedRect(5, 10, 78, 75, 5);
      g.fillStyle(0x603c2b).fillRect(2, 6, 82, 78);
      g.fillStyle(0xc68147).fillRect(7, 2, 72, 76);
      g.fillStyle(0xe9ad68, 0.7).fillRect(11, 8, 64, 5);
      for (let y = 19; y < 73; y += 14) g.lineStyle(2, 0x9b623b, 0.55).beginPath().moveTo(10, y).lineTo(75, y + 3).strokePath();
      g.lineStyle(7, 0x8a532f).strokeRect(9, 7, 68, 68);
      g.beginPath().moveTo(12, 10).lineTo(74, 72).moveTo(74, 10).lineTo(12, 72).strokePath();
      g.fillStyle(0x4b3430).fillCircle(13, 12, 3).fillCircle(73, 12, 3).fillCircle(13, 72, 3).fillCircle(73, 72, 3);
    });

    this.texture("glass", 74, 112, (g) => {
      g.fillStyle(0x2c2940, 0.2).fillRoundedRect(7, 8, 65, 103, 4);
      g.fillStyle(0x5da8b9, 0.25).fillRect(4, 4, 66, 104);
      g.lineStyle(6, 0xeefcff).strokeRect(4, 4, 66, 104);
      g.lineStyle(3, 0xffffff, 0.75).beginPath().moveTo(8, 22).lineTo(65, 83).moveTo(28, 7).lineTo(44, 108).strokePath();
      g.fillStyle(0xffffff, 0.45).fillTriangle(12, 10, 30, 10, 12, 46);
      g.lineStyle(2, 0xb8f3ff, 0.7).beginPath().moveTo(38, 56).lineTo(28, 68).lineTo(34, 86)
        .moveTo(38, 56).lineTo(52, 48).lineTo(64, 54).strokePath();
    });

    this.texture("sparkle", 30, 30, (g) => {
      g.fillStyle(0xffef99).fillTriangle(15, 0, 20, 12, 30, 15);
      g.fillTriangle(30, 15, 20, 19, 15, 30);
      g.fillTriangle(15, 30, 11, 19, 0, 15);
      g.fillTriangle(0, 15, 11, 11, 15, 0);
    });

    this.texture("bicycle", 128, 82, (g) => {
      g.fillStyle(0x30293a, 0.18).fillEllipse(64, 79, 120, 8);
      g.lineStyle(6, 0x3d4b58).strokeCircle(28, 57, 20).strokeCircle(100, 57, 20);
      g.lineStyle(2, 0xdde9e7, 0.65).strokeCircle(28, 57, 15).strokeCircle(100, 57, 15);
      g.lineStyle(6, 0xd75c58).beginPath().moveTo(28, 57).lineTo(55, 25).lineTo(75, 57).lineTo(28, 57)
        .moveTo(55, 25).lineTo(100, 57).moveTo(75, 57).lineTo(91, 20).lineTo(108, 20).strokePath();
      g.fillStyle(0x3d4b58).fillRoundedRect(45, 16, 25, 7, 3);
      g.fillStyle(0xf3c64d).fillCircle(28, 57, 4).fillCircle(100, 57, 4);
    });
    this.texture("tulip-cart", 112, 92, (g) => {
      g.fillStyle(0x34293a, 0.18).fillEllipse(56, 88, 100, 8);
      g.fillStyle(0x9a6543).fillRoundedRect(12, 34, 88, 42, 8);
      g.fillStyle(0xd5a06a).fillRoundedRect(18, 39, 76, 9, 4);
      g.fillStyle(0x553e3d).fillCircle(28, 77, 10).fillCircle(87, 77, 10);
      for (let x = 24; x < 95; x += 16) {
        g.lineStyle(4, 0x4e8d51).beginPath().moveTo(x, 38).lineTo(x, 12).strokePath();
        g.fillStyle(x % 32 ? 0xf06a72 : 0xffcf55).fillCircle(x, 10, 8);
      }
    });
    this.texture("lantern-gate", 98, 120, (g) => {
      g.fillStyle(0x2f2532, 0.18).fillEllipse(49, 117, 95, 9);
      g.fillStyle(0x7a3e36).fillRect(8, 8, 10, 108).fillRect(80, 8, 10, 108).fillRect(5, 10, 88, 12);
      g.fillStyle(0xd6a55b).fillRect(5, 10, 88, 4).fillCircle(13, 8, 7).fillCircle(85, 8, 7);
      g.fillStyle(0xe85d5f).fillRoundedRect(33, 30, 32, 42, 10);
      g.fillStyle(0xffd65a).fillRect(39, 39, 20, 22);
      g.fillStyle(0xfff0a0, 0.65).fillCircle(49, 50, 9);
    });
    this.texture("road-barrier", 116, 74, (g) => {
      g.fillStyle(0x302a35, 0.2).fillEllipse(58, 71, 110, 8);
      g.fillStyle(0x55505b).fillRect(15, 58, 16, 16).fillRect(85, 58, 16, 16);
      g.fillStyle(0xf8f0d8).fillRoundedRect(4, 16, 108, 42, 7);
      for (let x = 10; x < 105; x += 28) g.fillStyle(0xe86255).fillRect(x, 20, 17, 34);
      g.fillStyle(0xffffff, 0.7).fillRoundedRect(9, 19, 98, 5, 2);
      g.fillStyle(0xffd75a).fillCircle(16, 11, 7).fillCircle(100, 11, 7);
    });
    this.texture("carnival-drum", 88, 88, (g) => {
      g.fillStyle(0x20192b, 0.22).fillEllipse(44, 84, 80, 8);
      g.fillStyle(0xf0c655).fillCircle(44, 44, 39);
      g.lineStyle(8, 0xc34f75).strokeCircle(44, 44, 33);
      g.lineStyle(5, 0x67446f).beginPath().moveTo(15, 18).lineTo(72, 70).moveTo(72, 18).lineTo(15, 70).strokePath();
      g.fillStyle(0xffef9e, 0.7).fillCircle(32, 29, 7);
      g.lineStyle(3, 0xffe99b, 0.8).strokeCircle(44, 44, 26);
    });
  }

  texture(key, width, height, painter) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    painter(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

}
