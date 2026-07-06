import { SaveGame } from "../savegame/SaveGame.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.spritesheet("granny-skate", "/assets/sprites/granny-skate.png", { frameWidth: 512, frameHeight: 512 });
    this.load.spritesheet("thief-run", "/assets/sprites/thief-run.png", { frameWidth: 512, frameHeight: 512 });
    for (let world = 1; world <= 5; world += 1) {
      const file = world === 1 ? "cat-atlas.png" : `cat-atlas-world${world}.png`;
      this.load.spritesheet(`cat-real-${world}`, `/assets/sprites/${file}`, {
        frameWidth: 418,
        frameHeight: 418
      });
    }
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

    this.texture("granny", 110, 132, (g) => {
      g.fillStyle(0x39283f).fillCircle(38, 120, 12).fillCircle(78, 120, 12);
      g.fillStyle(0xf15062).fillRoundedRect(20, 60, 72, 56, 18);
      g.fillStyle(0xf6d1b5).fillCircle(55, 42, 29);
      g.fillStyle(0xf9f2df).fillCircle(38, 24, 17).fillCircle(58, 19, 20).fillCircle(75, 28, 15);
      g.fillStyle(0x39283f).fillCircle(45, 40, 4).fillCircle(67, 40, 4);
      g.lineStyle(3, 0x39283f).strokeCircle(43, 41, 10).strokeCircle(68, 41, 10);
      g.beginPath().moveTo(53, 41).lineTo(58, 41).strokePath();
      g.fillStyle(0xed7180).fillTriangle(48, 51, 61, 51, 55, 58);
      g.fillStyle(0x713f84).fillRoundedRect(29, 75, 54, 36, 12);
      g.lineStyle(7, 0x8a532e).beginPath().moveTo(88, 71).lineTo(95, 116).strokePath();
      g.lineStyle(5, 0xffffff).beginPath().moveTo(38, 120).lineTo(20, 125).strokePath();
      g.beginPath().moveTo(78, 120).lineTo(96, 125).strokePath();
      g.fillStyle(0x4bb9c5).fillCircle(20, 125, 5).fillCircle(96, 125, 5);
    });

    this.texture("thief", 106, 128, (g) => {
      g.fillStyle(0x34303c).fillRoundedRect(21, 53, 64, 60, 18);
      g.fillStyle(0xe0b494).fillCircle(51, 35, 27);
      g.fillStyle(0x34283a).fillRoundedRect(22, 23, 58, 18, 8);
      g.fillStyle(0x34283a).fillCircle(42, 37, 4).fillCircle(63, 37, 4);
      g.lineStyle(4, 0x34283a).beginPath().moveTo(39, 49).lineTo(65, 49).strokePath();
      g.fillStyle(0xd65454).fillRoundedRect(63, 67, 34, 45, 8);
      g.lineStyle(5, 0xffe1a4).strokeRoundedRect(68, 73, 24, 29, 5);
      g.fillStyle(0x34283a).fillRoundedRect(15, 108, 30, 10, 5).fillRoundedRect(62, 108, 30, 10, 5);
    });

    this.texture("cat-orange", 92, 88, (g) => this.drawCat(g, 0xf39a36, 0xffd990));
    this.texture("cat-dark", 92, 88, (g) => this.drawCat(g, 0x4a4353, 0x9990a6));
    this.texture("cat-white", 92, 88, (g) => this.drawCat(g, 0xf4ecdc, 0xd8cdbb));

    this.texture("crate", 86, 86, (g) => {
      g.fillStyle(0x603c2b).fillRect(2, 6, 82, 78);
      g.fillStyle(0xc68147).fillRect(7, 2, 72, 76);
      g.lineStyle(7, 0x8a532f).strokeRect(9, 7, 68, 68);
      g.beginPath().moveTo(12, 10).lineTo(74, 72).moveTo(74, 10).lineTo(12, 72).strokePath();
    });

    this.texture("glass", 74, 112, (g) => {
      g.fillStyle(0x5da8b9, 0.25).fillRect(4, 4, 66, 104);
      g.lineStyle(6, 0xeefcff).strokeRect(4, 4, 66, 104);
      g.lineStyle(3, 0xffffff, 0.75).beginPath().moveTo(8, 22).lineTo(65, 83).moveTo(28, 7).lineTo(44, 108).strokePath();
    });

    this.texture("banana", 68, 54, (g) => {
      g.lineStyle(13, 0x6f4a26).beginPath().arc(31, 18, 27, 0.12, 2.45).strokePath();
      g.lineStyle(9, 0xffd447).beginPath().arc(31, 16, 27, 0.12, 2.45).strokePath();
    });

    this.texture("yarn", 64, 64, (g) => {
      g.fillStyle(0x753d78).fillCircle(31, 31, 25);
      g.lineStyle(3, 0xc882cf).beginPath().arc(29, 23, 17, 0.2, 5.7).strokePath();
      g.beginPath().moveTo(19, 13).lineTo(44, 48).moveTo(13, 30).lineTo(49, 24).strokePath();
    });

    this.texture("helmet", 66, 54, (g) => {
      g.fillStyle(0xeaa82d).fillRoundedRect(10, 9, 46, 34, 18);
      g.fillStyle(0xffd45a).fillRoundedRect(3, 36, 60, 10, 5);
      g.lineStyle(4, 0x8a5b22).beginPath().moveTo(33, 10).lineTo(33, 37).strokePath();
    });

    this.texture("magnet", 66, 66, (g) => {
      g.lineStyle(15, 0xe95f67).beginPath().arc(33, 33, 22, Math.PI, Math.PI * 2).strokePath();
      g.fillStyle(0xe7edf0).fillRoundedRect(4, 29, 15, 23, 4).fillRoundedRect(47, 29, 15, 23, 4);
      g.fillStyle(0x7d8690).fillRect(4, 44, 15, 8).fillRect(47, 44, 15, 8);
    });

    this.texture("sparkle", 30, 30, (g) => {
      g.fillStyle(0xffef99).fillTriangle(15, 0, 20, 12, 30, 15);
      g.fillTriangle(30, 15, 20, 19, 15, 30);
      g.fillTriangle(15, 30, 11, 19, 0, 15);
      g.fillTriangle(0, 15, 11, 11, 15, 0);
    });

    this.texture("bicycle", 128, 82, (g) => {
      g.lineStyle(6, 0x3d4b58).strokeCircle(28, 57, 20).strokeCircle(100, 57, 20);
      g.lineStyle(6, 0xd75c58).beginPath().moveTo(28, 57).lineTo(55, 25).lineTo(75, 57).lineTo(28, 57)
        .moveTo(55, 25).lineTo(100, 57).moveTo(75, 57).lineTo(91, 20).lineTo(108, 20).strokePath();
      g.fillStyle(0x3d4b58).fillRoundedRect(45, 16, 25, 7, 3);
    });
    this.texture("tulip-cart", 112, 92, (g) => {
      g.fillStyle(0x9a6543).fillRoundedRect(12, 34, 88, 42, 8);
      g.fillStyle(0x553e3d).fillCircle(28, 77, 10).fillCircle(87, 77, 10);
      for (let x = 24; x < 95; x += 16) {
        g.lineStyle(4, 0x4e8d51).beginPath().moveTo(x, 38).lineTo(x, 12).strokePath();
        g.fillStyle(x % 32 ? 0xf06a72 : 0xffcf55).fillCircle(x, 10, 8);
      }
    });
    this.texture("lantern-gate", 98, 120, (g) => {
      g.fillStyle(0x7a3e36).fillRect(8, 8, 10, 108).fillRect(80, 8, 10, 108).fillRect(5, 10, 88, 12);
      g.fillStyle(0xe85d5f).fillRoundedRect(33, 30, 32, 42, 10);
      g.fillStyle(0xffd65a).fillRect(39, 39, 20, 22);
    });
    this.texture("road-barrier", 116, 74, (g) => {
      g.fillStyle(0x55505b).fillRect(15, 58, 16, 16).fillRect(85, 58, 16, 16);
      g.fillStyle(0xf8f0d8).fillRoundedRect(4, 16, 108, 42, 7);
      for (let x = 10; x < 105; x += 28) g.fillStyle(0xe86255).fillRect(x, 20, 17, 34);
    });
    this.texture("carnival-drum", 88, 88, (g) => {
      g.fillStyle(0xf0c655).fillCircle(44, 44, 39);
      g.lineStyle(8, 0xc34f75).strokeCircle(44, 44, 33);
      g.lineStyle(5, 0x67446f).beginPath().moveTo(15, 18).lineTo(72, 70).moveTo(72, 18).lineTo(15, 70).strokePath();
    });
  }

  texture(key, width, height, painter) {
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    painter(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  drawCat(g, body, detail) {
    g.fillStyle(body);
    g.fillTriangle(16, 27, 24, 1, 38, 24);
    g.fillTriangle(54, 24, 70, 1, 77, 29);
    g.fillCircle(47, 37, 31);
    g.fillEllipse(49, 68, 62, 34);
    g.fillStyle(detail).fillTriangle(22, 22, 25, 9, 33, 23).fillTriangle(61, 23, 69, 9, 72, 25);
    g.fillStyle(0x322837).fillCircle(36, 35, 4).fillCircle(58, 35, 4);
    g.fillStyle(0xef7e82).fillTriangle(42, 45, 52, 45, 47, 51);
    g.lineStyle(2, 0x322837).beginPath().moveTo(40, 49).lineTo(26, 46).moveTo(40, 52).lineTo(24, 55).moveTo(54, 49).lineTo(68, 45).moveTo(54, 52).lineTo(70, 56).strokePath();
  }
}
