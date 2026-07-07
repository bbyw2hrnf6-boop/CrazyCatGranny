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
    this.load.audio("cat-meow-real", "assets/audio/cat-meow-pleading.oga");
    this.load.audio("cat-purr-real", "assets/audio/cat-purr.oga");
  }

  create() {
    this.makeTextures();
    this.makeAnimations();
    this.registry.set("save", SaveGame.load());
    SaveGame.startCloudSync((save) => this.applyCloudSave(save));
    this.scene.start("MainMenu");
  }

  applyCloudSave(save) {
    this.registry.set("save", save);
    const active = this.scene.manager.getScenes(true)
      .find((scene) => scene.scene.key !== "BootScene");
    if (active && active.scene.key !== "GameScene") {
      active.scene.restart(active.scene.settings.data || {});
    }
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
      g.fillStyle(0x2f2530, 0.24).fillRoundedRect(5, 12, 78, 72, 7);
      g.fillStyle(0x6b3f2a).fillRoundedRect(3, 5, 80, 76, 5);
      g.fillStyle(0xc98545).fillRoundedRect(8, 2, 70, 74, 4);
      g.fillStyle(0xf0b36b, 0.72).fillRoundedRect(12, 8, 62, 9, 3);
      g.fillStyle(0xa8673a, 0.8).fillRect(12, 53, 62, 16);
      for (let y = 24; y < 66; y += 13) {
        g.lineStyle(2, 0x8c5634, 0.52).beginPath().moveTo(12, y).lineTo(74, y + 3).strokePath();
      }
      g.lineStyle(7, 0x7c492c).strokeRoundedRect(9, 7, 68, 68, 4);
      g.lineStyle(6, 0x5d3929).beginPath()
        .moveTo(13, 13).lineTo(73, 71)
        .moveTo(73, 13).lineTo(13, 71)
        .strokePath();
      g.lineStyle(3, 0xefbd80, 0.75).beginPath().moveTo(18, 18).lineTo(38, 37).moveTo(65, 18).lineTo(46, 36).strokePath();
      g.fillStyle(0x3e2a27).fillCircle(13, 12, 3).fillCircle(73, 12, 3).fillCircle(13, 72, 3).fillCircle(73, 72, 3);
    });

    this.texture("glass", 74, 112, (g) => {
      g.fillStyle(0x2c2940, 0.2).fillRoundedRect(8, 9, 63, 101, 7);
      g.fillStyle(0x86d5e6, 0.32).fillRoundedRect(5, 4, 64, 103, 5);
      g.fillStyle(0x2d6d82, 0.18).fillRoundedRect(10, 9, 54, 93, 4);
      g.lineStyle(6, 0xeefcff).strokeRoundedRect(5, 4, 64, 103, 5);
      g.lineStyle(4, 0x61aebf, 0.9).strokeRoundedRect(9, 8, 56, 95, 3);
      g.lineStyle(3, 0xffffff, 0.78).beginPath()
        .moveTo(11, 24).lineTo(63, 84)
        .moveTo(27, 8).lineTo(44, 107)
        .strokePath();
      g.fillStyle(0xffffff, 0.52).fillTriangle(13, 11, 33, 11, 13, 49);
      g.lineStyle(2, 0xb8f3ff, 0.75).beginPath()
        .moveTo(38, 54).lineTo(28, 68).lineTo(34, 88)
        .moveTo(38, 54).lineTo(53, 46).lineTo(65, 54)
        .moveTo(22, 90).lineTo(35, 82).lineTo(47, 99)
        .strokePath();
    });

    this.texture("sparkle", 30, 30, (g) => {
      g.fillStyle(0xffef99).fillTriangle(15, 0, 20, 12, 30, 15);
      g.fillTriangle(30, 15, 20, 19, 15, 30);
      g.fillTriangle(15, 30, 11, 19, 0, 15);
      g.fillTriangle(0, 15, 11, 11, 15, 0);
    });

    this.texture("bicycle", 128, 82, (g) => {
      g.fillStyle(0x30293a, 0.2).fillEllipse(64, 79, 118, 9);
      g.lineStyle(7, 0x293442).strokeCircle(28, 57, 20).strokeCircle(100, 57, 20);
      g.lineStyle(2, 0xeaf3ef, 0.75).strokeCircle(28, 57, 15).strokeCircle(100, 57, 15);
      for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
        g.lineStyle(1, 0xeaf3ef, 0.55).beginPath()
          .moveTo(28, 57).lineTo(28 + Math.cos(angle) * 17, 57 + Math.sin(angle) * 17)
          .moveTo(100, 57).lineTo(100 + Math.cos(angle) * 17, 57 + Math.sin(angle) * 17)
          .strokePath();
      }
      g.lineStyle(7, 0x9f3f45).beginPath().moveTo(28, 57).lineTo(55, 25).lineTo(75, 57).lineTo(28, 57)
        .moveTo(55, 25).lineTo(100, 57).moveTo(75, 57).lineTo(91, 20).lineTo(108, 20).strokePath();
      g.lineStyle(3, 0xffb6a8, 0.8).beginPath().moveTo(36, 51).lineTo(57, 28).lineTo(74, 55).strokePath();
      g.fillStyle(0x293442).fillRoundedRect(44, 15, 27, 8, 4);
      g.fillStyle(0x293442).fillRoundedRect(104, 16, 18, 6, 3);
      g.fillStyle(0xf3c64d).fillCircle(28, 57, 4).fillCircle(100, 57, 4).fillCircle(75, 57, 4);
    });
    this.texture("tulip-cart", 112, 92, (g) => {
      g.fillStyle(0x34293a, 0.2).fillEllipse(56, 88, 100, 8);
      g.fillStyle(0x704431).fillRoundedRect(10, 32, 92, 46, 9);
      g.fillStyle(0xbd7a4d).fillRoundedRect(14, 34, 84, 39, 8);
      g.fillStyle(0xe0ae73).fillRoundedRect(19, 40, 74, 10, 4);
      g.lineStyle(4, 0x684030).strokeRoundedRect(14, 34, 84, 39, 8);
      g.fillStyle(0x3b3038).fillCircle(28, 77, 11).fillCircle(87, 77, 11);
      g.fillStyle(0xded6bf).fillCircle(28, 77, 5).fillCircle(87, 77, 5);
      for (let x = 24; x < 95; x += 16) {
        g.lineStyle(4, 0x4e8d51).beginPath().moveTo(x, 38).lineTo(x, 12).strokePath();
        g.fillStyle(x % 32 ? 0xf06a72 : 0xffcf55).fillCircle(x, 10, 8);
        g.fillStyle(0xffffff, 0.42).fillCircle(x - 3, 7, 3);
      }
    });
    this.texture("lantern-gate", 98, 120, (g) => {
      g.fillStyle(0x2f2532, 0.2).fillEllipse(49, 117, 95, 9);
      g.fillStyle(0x5b2f31).fillRect(7, 8, 12, 108).fillRect(79, 8, 12, 108).fillRect(5, 10, 88, 14);
      g.fillStyle(0x8f4b3f).fillRect(11, 13, 5, 98).fillRect(83, 13, 5, 98);
      g.fillStyle(0xd6a55b).fillRect(5, 10, 88, 5).fillCircle(13, 8, 7).fillCircle(85, 8, 7);
      g.lineStyle(4, 0x3b2730).strokeRect(7, 8, 12, 108).strokeRect(79, 8, 12, 108);
      g.lineStyle(4, 0x3b2730).beginPath().moveTo(49, 22).lineTo(49, 31).strokePath();
      g.fillStyle(0xbf434f).fillRoundedRect(31, 29, 36, 45, 11);
      g.fillStyle(0xf07173).fillRoundedRect(36, 32, 26, 39, 9);
      g.lineStyle(3, 0x7e323d).beginPath().moveTo(35, 44).lineTo(63, 44).moveTo(35, 58).lineTo(63, 58).strokePath();
      g.fillStyle(0xffd65a).fillRect(39, 39, 20, 22);
      g.fillStyle(0xfff0a0, 0.72).fillCircle(49, 50, 10);
    });
    this.texture("road-barrier", 116, 74, (g) => {
      g.fillStyle(0x302a35, 0.22).fillEllipse(58, 71, 110, 8);
      g.fillStyle(0x47424c).fillRect(15, 56, 17, 18).fillRect(84, 56, 17, 18);
      g.fillStyle(0x2d2830).fillRect(13, 68, 21, 5).fillRect(82, 68, 21, 5);
      g.fillStyle(0xfff2d8).fillRoundedRect(4, 16, 108, 42, 7);
      g.lineStyle(5, 0x3b3440).strokeRoundedRect(4, 16, 108, 42, 7);
      for (let x = 11; x < 103; x += 29) {
        g.fillStyle(0xe86255).fillRect(x, 20, 18, 34);
        g.fillStyle(0xff9d8f, 0.55).fillRect(x + 3, 22, 4, 29);
      }
      g.fillStyle(0xffffff, 0.76).fillRoundedRect(10, 20, 96, 5, 2);
      g.fillStyle(0xffd75a).fillCircle(16, 11, 7).fillCircle(100, 11, 7);
      g.fillStyle(0xffffff, 0.5).fillCircle(14, 9, 3).fillCircle(98, 9, 3);
    });
    this.texture("carnival-drum", 88, 88, (g) => {
      g.fillStyle(0x20192b, 0.24).fillEllipse(44, 84, 80, 8);
      g.fillStyle(0xf0c655).fillCircle(44, 44, 39);
      g.lineStyle(7, 0x3a2a43).strokeCircle(44, 44, 39);
      g.lineStyle(8, 0xc34f75).strokeCircle(44, 44, 32);
      g.lineStyle(5, 0x67446f).beginPath().moveTo(15, 18).lineTo(72, 70).moveTo(72, 18).lineTo(15, 70).strokePath();
      g.lineStyle(3, 0xffe99b, 0.86).strokeCircle(44, 44, 24);
      g.fillStyle(0xffef9e, 0.74).fillCircle(31, 28, 7);
      g.fillStyle(0xffffff, 0.5).fillCircle(27, 24, 3);
      g.fillStyle(0xff6e9f).fillCircle(44, 44, 7);
    });
  }

  texture(key, width, height, painter) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    painter(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

}
