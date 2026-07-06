import { Granny } from "../objects/Granny.js";
import { addCoin, addTreat } from "../objects/Collectibles.js";
import { addDetailedCat, catFrameForLevel } from "../objects/Cat.js";
import { addGrannyGear, syncGrannyGear } from "../objects/Outfits.js";
import { levelById, worldById } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { COLORS, pill, sound, textStyle } from "../ui/ui.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.level = levelById(data.levelId);
    this.worldData = worldById(this.level.world);
    this.coinsCollected = 0;
    this.treatsCollected = 0;
    this.falls = 0;
    this.elapsed = 0;
    this.running = false;
    this.finished = false;
    this.jumpHeld = false;
    this.caneHeld = false;
    this.respawnX = 170;
    this.stuckFor = 0;
    this.lastDustAt = 0;
    this.lastFallCheckpoint = -999;
    this.repeatFallCount = 0;
  }

  create() {
    this.physics.world.setBounds(0, 0, this.level.length + 800, 860);
    this.cameras.main.setBounds(0, 0, this.level.length, 720);
    this.cameras.main.setBackgroundColor(this.worldData.sky);
    this.drawBackground();

    this.platforms = this.physics.add.staticGroup();
    this.breakables = this.physics.add.staticGroup();
    this.hooks = this.add.group();
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.treats = this.physics.add.group({ allowGravity: false, immovable: true });
    this.worldZones = [];
    this.mechanicCooldown = 0;
    this.makeCourse();
    this.createWorldMechanics();

    this.granny = new Granny(this, 150, 500);
    this.granny.runSpeed = 305 + this.level.id * 6;
    this.save = SaveGame.load();
    if (this.save.equippedGear === "yarnBoost") this.granny.runSpeed += 38;
    this.grannyGear = addGrannyGear(this, this.granny, this.save.equippedGear, 14);
    this.applyLevelGimmick();
    this.physics.add.collider(this.granny, this.platforms, this.onLand, undefined, this);
    this.physics.add.collider(this.granny, this.breakables, this.smashBreakable, undefined, this);
    this.physics.add.overlap(this.granny, this.coins, this.takeCoin, undefined, this);
    this.physics.add.overlap(this.granny, this.treats, this.takeTreat, undefined, this);

    this.cameras.main.startFollow(this.granny, true, 0.085, 0.08, -260, 60);
    this.cameras.main.setDeadzone(170, 90);
    this.events.on("granny-land", this.onGrannyLand, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off("granny-land", this.onGrannyLand, this));
    this.createThief();
    this.createFinish();
    this.createHUD();
    this.createControls();
    this.createReactiveProps();
    if (this.level.boss) this.createBossEncounter();
    this.createIntro();
    this.bindKeys();
  }

  update(_time, delta) {
    if (!this.running || this.finished) return;
    this.elapsed += delta / 1000;

    if (this.caneHeld && !this.granny.isSwinging) this.tryLatch();
    if (this.granny.isSwinging) this.granny.swing(delta);
    else this.granny.updateMovement(delta, this.jumpHeld);

    this.updateGear();
    this.keepPathOpen(delta);
    this.applyWorldMechanics();
    this.updateThief(delta);
    this.updateBossEncounter();
    this.updateHUD();
    this.updateRope();
    this.updateReactiveProps();
    this.parallax();
    this.addSkateDust();

    if (this.granny.y > 760 || this.granny.x < this.cameras.main.scrollX - 130) this.fall();
    if (this.granny.x >= this.level.length - 260) {
      if (this.level.boss && this.bossHealth > 0) {
        this.granny.x = this.level.length - 330;
        this.granny.setVelocityX(120);
        if (this.activeWeakPoint?.active) this.activeWeakPoint.setPosition(this.level.length - 230, 485);
      } else this.complete();
    }
  }

  drawBackground() {
    this.skyLayer = this.add.tileSprite(0, 0, 1280, 720, null).setOrigin(0).setScrollFactor(0).setDepth(-20);
    const g = this.add.graphics().setDepth(-18);
    const world = this.level.world;
    g.fillStyle(this.worldData.sky).fillRect(0, 0, this.level.length, 720);
    g.fillStyle(world === 1 ? 0xfff0b8 : 0xffd49d, 0.9).fillCircle(980, 115, 63);

    for (let x = 0; x < this.level.length; x += 380) {
      const segment = Math.floor(x / 380);
      if (world === 1) {
        this.drawSuburbSegment(g, x, segment);
      } else if (world === 2) {
        this.drawNetherlandsSegment(g, x, segment);
      } else if (world === 3) {
        this.drawAsiaSegment(g, x, segment);
      } else if (world === 4) {
        this.drawUsaSegment(g, x, segment);
      } else {
        this.drawCarnivalSegment(g, x, segment);
      }
    }
    this.bgGraphics = g;
    this.createAmbientDetails();
  }

  drawSuburbSegment(g, x, segment) {
    const type = this.level.gimmick;
    if (type === "glass") {
      g.fillStyle(0xa8dde0, 0.6).fillRoundedRect(x + 35, 290, 310, 210, 18);
      g.lineStyle(7, 0xf2faf6).strokeRoundedRect(x + 35, 290, 310, 210, 18)
        .beginPath().moveTo(x + 190, 290).lineTo(x + 190, 500).moveTo(x + 35, 395).lineTo(x + 345, 395).strokePath();
      for (let plant = 0; plant < 5; plant += 1) g.fillStyle(0x5a9b55).fillCircle(x + 75 + plant * 58, 455, 28);
    } else if (["crates", "hooks"].includes(type)) {
      g.fillStyle(0xc79058).fillRect(x + 30, 370, 110, 130).fillRect(x + 150, 410, 90, 90);
      g.lineStyle(7, 0xf0bd4d).beginPath().moveTo(x + 280, 500).lineTo(x + 280, 230).lineTo(x + 370, 230).strokePath();
      g.fillStyle(0x5b5253).fillRect(x + 330, 230, 8, 120);
    } else if (type === "cars") {
      g.fillStyle(0x555b68).fillRect(x, 425, 380, 75);
      const carColor = segment % 2 ? 0xe55d62 : 0x4b8fb0;
      g.fillStyle(carColor).fillRoundedRect(x + 45, 400, 260, 62, 22);
      g.fillStyle(0xbbe2e4).fillRoundedRect(x + 95, 370, 140, 50, 18);
      g.fillStyle(0x34303b).fillCircle(x + 100, 465, 22).fillCircle(x + 260, 465, 22);
    } else if (type === "bounce") {
      for (let stall = 0; stall < 3; stall += 1) {
        g.fillStyle(stall % 2 ? 0xef6b70 : 0xffce58).fillTriangle(x + stall * 125, 360, x + 60 + stall * 125, 300, x + 120 + stall * 125, 360);
        g.fillStyle(0x8d5a43).fillRect(x + 10 + stall * 125, 360, 100, 140);
      }
    } else {
      const h = 120 + (segment % 3) * 35;
      g.fillStyle(segment % 2 ? 0xd66565 : 0x6c8fc0).fillRect(x + 70, 480 - h, 230, h);
      g.fillStyle(0xffefd0).fillRect(x + 90, 500 - h, 190, h - 20);
      g.fillStyle(0x5e8fa0).fillRect(x + 120, 420 - h, 50, 60).fillRect(x + 205, 420 - h, 50, 60);
      g.fillStyle(0x7a513b).fillRect(x + 175, 430, 42, 70);
      if (["cane", "rooftop", "boss-suburb"].includes(type)) {
        g.lineStyle(4, 0x55454e).beginPath().moveTo(x + 15, 285).lineTo(x + 360, 315).strokePath();
        for (let cloth = 0; cloth < 4; cloth += 1) g.fillStyle(cloth % 2 ? 0xf3be4c : 0xe85f68).fillRect(x + 75 + cloth * 65, 300, 40, 45);
      }
    }
  }

  drawNetherlandsSegment(g, x, segment) {
    const type = this.level.gimmick;
    if (type === "canal") {
      g.fillStyle(0x62b8ca, 0.75).fillRect(x, 420, 380, 80);
      if (segment % 3 === 0) {
        g.fillStyle(0xb9584f).fillRoundedRect(x + 45, 330, 265, 105, 10);
        g.fillStyle(0xffe7b8).fillRect(x + 70, 345, 215, 72);
        g.fillStyle(0x416f85).fillRect(x + 92, 362, 44, 38).fillRect(x + 220, 362, 44, 38);
        g.fillStyle(0x684d3e).fillRect(x + 32, 430, 292, 12);
      } else if (segment % 3 === 1) {
        g.lineStyle(24, 0x9a674d).beginPath().arc(x + 190, 425, 145, Math.PI, Math.PI * 2).strokePath();
        g.lineStyle(7, 0xe0b174).beginPath().arc(x + 190, 425, 145, Math.PI, Math.PI * 2).strokePath();
        g.fillStyle(0x4b824f).fillCircle(x + 45, 365, 38).fillCircle(x + 330, 365, 38);
      } else {
        const colors = [0xd05d55, 0x506f89, 0xc89a4e];
        for (let house = 0; house < 3; house += 1) {
          g.fillStyle(colors[house]).fillRect(x + 22 + house * 116, 280 + house * 20, 102, 150 - house * 20);
          g.fillStyle(0xffe7b8).fillRect(x + 45 + house * 116, 325 + house * 20, 34, 46);
        }
      }
      g.lineStyle(4, 0xe8f9fb, 0.5).beginPath().moveTo(x + 10, 465).lineTo(x + 160, 465).moveTo(x + 205, 480).lineTo(x + 365, 480).strokePath();
    } else if (["windmill", "boss-windmill"].includes(type)) {
      g.fillStyle(0x75a866).fillEllipse(x + 190, 490, 410, 95);
      g.fillStyle(0xf8f0d8).fillRect(x + 175, 260, 28, 230);
      g.fillStyle(0x9b5b48).fillTriangle(x + 150, 265, x + 189, 215, x + 228, 265);
      g.lineStyle(type === "boss-windmill" ? 13 : 9, 0xf8f0d8).beginPath().moveTo(x + 189, 325).lineTo(x + 75, 210)
        .moveTo(x + 189, 325).lineTo(x + 303, 210).moveTo(x + 189, 325).lineTo(x + 75, 440).moveTo(x + 189, 325).lineTo(x + 303, 440).strokePath();
    } else if (type === "bicycles") {
      const colors = [0xb7534e, 0x3e7187, 0xd09a45];
      for (let house = 0; house < 3; house += 1) {
        g.fillStyle(colors[(segment + house) % colors.length]).fillRect(x + house * 125, 285 + house * 18, 112, 215 - house * 18);
        g.fillStyle(0xffe6b8).fillRect(x + 18 + house * 125, 320 + house * 18, 35, 55);
      }
      for (let bike = 0; bike < 2; bike += 1) {
        const bx = x + 65 + bike * 175;
        g.lineStyle(4, 0x3c4650).strokeCircle(bx, 470, 19).strokeCircle(bx + 67, 470, 19)
          .beginPath().moveTo(bx, 470).lineTo(bx + 28, 435).lineTo(bx + 45, 470).lineTo(bx, 470).moveTo(bx + 28, 435).lineTo(bx + 67, 470).strokePath();
      }
    } else if (type === "tulips") {
      g.fillStyle(0xd9eee2).fillRoundedRect(x + 45, 280, 285, 180, 25);
      g.lineStyle(5, 0xffffff, 0.7).strokeRoundedRect(x + 45, 280, 285, 180, 25);
      for (let flower = 0; flower < 13; flower += 1) {
        const fx = x + 15 + flower * 29;
        const color = [0xf05d6b, 0xffd24f, 0x9b65b1][(flower + segment) % 3];
        g.lineStyle(3, 0x4a914f).beginPath().moveTo(fx, 500).lineTo(fx, 455 - (flower % 3) * 8).strokePath();
        g.fillStyle(color).fillCircle(fx, 450 - (flower % 3) * 8, 7);
      }
      g.fillStyle(0x5b9a56, 0.75).fillCircle(x + 330, 430, 30).fillCircle(x + 355, 455, 24);
    } else if (type === "cheese") {
      g.fillStyle(0xf2ead6).fillRect(x + 30, 310, 320, 190);
      g.fillStyle(segment % 2 ? 0xe55e5f : 0x4a86a0).fillRect(x + 20, 290, 340, 35);
      for (let wheel = 0; wheel < 4; wheel += 1) g.fillStyle(0xf3c84e).fillCircle(x + 75 + wheel * 70, 450, 25);
      g.fillStyle(0x4f9a55).fillCircle(x + 315, 375, 28).fillCircle(x + 340, 392, 22);
    } else if (type === "harbor") {
      g.fillStyle(0x59adbf, 0.75).fillRect(x, 420, 380, 80);
      g.fillStyle(0xf5e8cd).fillTriangle(x + 170, 245, x + 170, 430, x + 300, 430);
      g.fillStyle(0xb34f4f).fillTriangle(x + 160, 300, x + 160, 430, x + 65, 430);
      g.fillStyle(0x6f4a39).fillRect(x + 155, 235, 12, 240);
      g.fillStyle(0x8e5a3d).fillRoundedRect(x + 45, 430, 280, 35, 15);
    } else if (type === "dike") {
      g.fillStyle(0x65afc0).fillRect(x, 380, 380, 120);
      g.fillStyle(0x6c9f58).fillTriangle(x - 20, 500, x + 195, 260, x + 400, 500);
      g.fillStyle(0xf5e8cc).fillRect(x + 180, 315, 34, 185);
      g.fillStyle(0x4d7181).fillRoundedRect(x + 250, 420, 90, 55, 8);
    } else {
      g.fillStyle(segment % 2 ? 0xb75f58 : 0x516f86).fillRect(x + 55, 330, 250, 170);
      g.fillStyle(0xffe8bd).fillRect(x + 72, 350, 216, 150);
      g.fillStyle(0xc8544f).fillTriangle(x + 35, 330, x + 180, 225, x + 325, 330);
    }
  }

  drawAsiaSegment(g, x, segment) {
    const type = this.level.gimmick;
    if (type === "bamboo") {
      for (let stalk = 0; stalk < 8; stalk += 1) {
        const sx = x + 25 + stalk * 48;
        g.fillStyle(stalk % 2 ? 0x4f8d55 : 0x69a85d).fillRoundedRect(sx, 230 + (stalk % 3) * 35, 18, 270, 8);
      }
    } else if (["neon", "boss-dragon"].includes(type)) {
      const h = 250 + (segment % 3) * 45;
      g.fillStyle(segment % 2 ? 0x393052 : 0x49365b).fillRect(x + 30, 500 - h, 320, h);
      for (let sign = 0; sign < 4; sign += 1) g.fillStyle(sign % 2 ? 0x50d4d5 : 0xff6c9d).fillRoundedRect(x + 65 + sign * 68, 310 + sign * 35, 38, 55, 8);
    } else if (type === "market") {
      for (let stall = 0; stall < 3; stall += 1) {
        g.fillStyle(stall % 2 ? 0xdd5c61 : 0xf1bd4c).fillTriangle(x + stall * 125, 350, x + 60 + stall * 125, 300, x + 120 + stall * 125, 350);
        g.fillStyle(0x70494c).fillRect(x + 10 + stall * 125, 350, 100, 150);
      }
    } else if (type === "rail") {
      g.fillStyle(0xd8e8e8).fillRoundedRect(x + 25, 360, 330, 105, 35);
      g.fillStyle(0x417fa0).fillRect(x + 70, 385, 55, 38).fillRect(x + 155, 385, 55, 38).fillRect(x + 240, 385, 55, 38);
      g.fillStyle(0x444754).fillRect(x, 475, 380, 12);
    } else {
      const h = 190 + (segment % 3) * 38;
      g.fillStyle(segment % 2 ? 0x4c4268 : 0x6b4667).fillRect(x + 48, 500 - h, 275, h);
      g.fillStyle(0xf2c14e).fillRoundedRect(x + 80, 420 - h, 34, 55, 8).fillRoundedRect(x + 250, 440 - h, 34, 55, 8);
      g.fillStyle(0xde5964).fillTriangle(x + 30, 500 - h, x + 185, 425 - h, x + 340, 500 - h);
    }
  }

  drawUsaSegment(g, x, segment) {
    const type = this.level.gimmick;
    if (["desert", "canyon"].includes(type)) {
      g.fillStyle(0xd78b55).fillTriangle(x - 20, 500, x + 95, 280, x + 180, 500).fillTriangle(x + 120, 500, x + 285, 235, x + 410, 500);
      g.fillStyle(0x619052).fillRect(x + 330, 390, 20, 110).fillRect(x + 300, 420, 50, 18).fillRect(x + 345, 440, 35, 18);
    } else if (type === "bayou") {
      g.fillStyle(0x4e8e86).fillRect(x, 410, 380, 90);
      for (let tree = 0; tree < 3; tree += 1) {
        g.fillStyle(0x57473d).fillRect(x + 45 + tree * 135, 300, 18, 170);
        g.fillStyle(0x477b50).fillCircle(x + 55 + tree * 135, 290, 60);
      }
    } else if (type === "space") {
      g.fillStyle(0xe9eef0).fillRoundedRect(x + 130, 255, 90, 245, 42);
      g.fillStyle(0xd65357).fillTriangle(x + 130, 430, x + 75, 500, x + 150, 480).fillTriangle(x + 220, 430, x + 285, 500, x + 200, 480);
      g.fillStyle(0x4a8199).fillCircle(x + 175, 330, 24);
    } else if (type === "hollywood") {
      g.fillStyle(0xe9d4a7).fillRect(x + 40, 300, 300, 200);
      g.fillStyle(segment % 2 ? 0xc65256 : 0x4c7d97).fillRect(x + 55, 320, 270, 36);
      g.fillStyle(0x4c4851).fillCircle(x + 305, 265, 28).fillRect(x + 300, 245, 8, 80);
    } else {
      const h = 230 + (segment % 3) * 50;
      g.fillStyle(segment % 2 ? 0xb65f45 : 0x477c99).fillRect(x + 40, 500 - h, 290, h);
      for (let wx = 75; wx < 300; wx += 55) for (let wy = 535 - h; wy < 445; wy += 64) g.fillStyle(0xffdc73).fillRect(x + wx, wy, 25, 33);
    }
  }

  drawCarnivalSegment(g, x, segment) {
    const type = this.level.gimmick;
    if (type === "mirrors") {
      for (let mirror = 0; mirror < 3; mirror += 1) {
        g.fillStyle(0xbce8eb, 0.7).fillRoundedRect(x + 20 + mirror * 122, 260, 95, 235, 20);
        g.lineStyle(8, mirror % 2 ? 0xff6e9f : 0xffd65d).strokeRoundedRect(x + 20 + mirror * 122, 260, 95, 235, 20);
      }
    } else if (type === "coaster") {
      g.lineStyle(12, 0xe75d89).beginPath().moveTo(x, 450).lineTo(x + 85, 270).lineTo(x + 180, 430).lineTo(x + 275, 220).lineTo(x + 380, 450).strokePath();
      g.lineStyle(5, 0xffd65d).beginPath().moveTo(x, 470).lineTo(x + 380, 470).strokePath();
    } else if (type === "fireworks") {
      for (let star = 0; star < 5; star += 1) {
        const sx = x + 45 + star * 75;
        const sy = 245 + (star % 3) * 60;
        g.lineStyle(4, star % 2 ? 0xff6e9f : 0xffd65d).strokeCircle(sx, sy, 28);
      }
      g.fillStyle(0x71456f).fillTriangle(x + 20, 500, x + 190, 290, x + 360, 500);
    } else {
      g.fillStyle(0xcf8c56).fillRect(x + 65, 365, 260, 135);
      g.fillStyle(segment % 2 ? 0x6d3f83 : 0xb34d74).fillTriangle(x + 30, 500, x + 195, 235, x + 350, 500);
      g.fillStyle(0xffe18a).fillCircle(x + 195, 220, 24);
      if (["carousel", "boss-maestro"].includes(type)) {
        g.lineStyle(6, 0xffd45f).strokeCircle(x + 195, 340, 90);
        for (let spoke = 0; spoke < 8; spoke += 1) {
          const angle = (Math.PI * 2 * spoke) / 8;
          g.beginPath().moveTo(x + 195, 340).lineTo(x + 195 + Math.cos(angle) * 90, 340 + Math.sin(angle) * 90).strokePath();
        }
      }
    }
  }

  createAmbientDetails() {
    for (let i = 0; i < 8; i += 1) {
      const x = 360 + i * Math.max(650, this.level.length / 7);
      const y = 125 + (i % 3) * 38;
      const parts = [
        this.add.circle(-34, 8, 25, 0xffffff, 0.55),
        this.add.circle(0, 0, 38, 0xffffff, 0.62),
        this.add.circle(40, 10, 27, 0xffffff, 0.55),
        this.add.ellipse(4, 22, 125, 30, 0xffffff, 0.55)
      ];
      const cloud = this.add.container(x, y, parts).setDepth(-17).setScrollFactor(0.22);
      this.tweens.add({ targets: cloud, x: x + 140, duration: 9000 + i * 500, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
  }

  makeCourse() {
    const length = this.level.length;
    const gaps = [];
    if (this.level.id === 1) gaps.push([1520, 1650], [3300, 3440]);
    else {
      const stride = 1420 - this.level.world * 35;
      for (let x = 1050; x < length - 850; x += stride) {
        const gapWidth = 145 + ((Math.floor(x / stride) + this.level.world) % 3) * 18;
        gaps.push([x, x + gapWidth]);
      }
    }
    let cursor = 0;
    for (const [start, end] of gaps) {
      this.addPlatform(cursor, 590, start - cursor, 160);
      cursor = end;
    }
    this.addPlatform(cursor, 590, length - cursor + 500, 160);

    const raised = [];
    for (let x = 680, index = 0; x < length - 420; x += 860, index += 1) {
      raised.push([x, 475 - (index % 3) * 55, 250 + (index % 2) * 70]);
    }
    raised.push([this.level.length - 850, 390, 380]);
    raised.forEach(([x, y, width], index) => {
      if (x < length - 300) this.addPlatform(x, y, width, 34, index % 2 ? 0xc97b54 : 0xf2c56e);
    });

    const hookXs = this.level.id === 1 ? [3380] : [];
    if (this.level.id > 1) {
      for (let x = 1120; x < length - 650; x += 1500 - this.level.world * 55) hookXs.push(x);
    }
    hookXs.forEach((x, index) => {
      const hook = this.add.image(x, 230 + (index % 2) * 35, "hook").setDepth(8);
      hook.setData("used", false);
      this.hooks.add(hook);
    });

    for (let x = 420; x < length - 350; x += 175) {
      const wave = Math.sin(x * 0.008) * 65;
      addCoin(this, x, 435 + wave, this.coins);
    }
    [
      [Math.round(length * 0.18), 350],
      [Math.round(length * 0.52), 300],
      [Math.round(length * 0.86), 285]
    ].forEach(([x, y]) => addTreat(this, x, y, this.treats));

    const obstacles = [];
    for (let x = 1380; x < length - 520; x += this.level.boss ? 850 : 1250) obstacles.push(x);
    obstacles.forEach((x, index) => {
      const textures = {
        1: this.level.gimmick === "glass" ? ["glass", "crate"] : ["crate", "glass"],
        2: ["bicycle", "tulip-cart", "crate"],
        3: ["lantern-gate", "crate", "glass"],
        4: ["road-barrier", "crate", "bicycle"],
        5: ["carnival-drum", "glass", "crate"]
      }[this.level.world];
      const texture = textures[(index + this.level.id) % textures.length];
      const obstacle = this.breakables.create(x, texture === "lantern-gate" ? 520 : texture === "bicycle" ? 548 : 540, texture);
      const scale = texture === "crate" ? 0.8 : texture === "glass" ? 1 : 0.82;
      obstacle.setScale(scale).refreshBody();
      obstacle.setData("type", texture);
    });

    if (this.level.id > 3) {
      for (let x = 1700; x < length - 700; x += 1900) {
        const awning = this.addPlatform(x, 505, 250, 24, 0xe85e68);
        awning.setData("bounce", true);
      }
    }
  }

  createWorldMechanics() {
    if (this.level.world === 1) return;
    const labels = {
      2: ["WIND", 0x58b5c9, "»"],
      3: ["BAMBOO", 0xe8b84d, "↑"],
      4: ["TURBO", 0xe95e63, "»"],
      5: ["MOON LIFT", 0x9c75da, "✦"]
    };
    const [label, color, icon] = labels[this.level.world];
    const spacing = this.level.boss ? 1150 : 1750;
    for (let x = 1650; x < this.level.length - 600; x += spacing) {
      const width = this.level.world === 3 ? 180 : 300;
      this.worldZones.push({ x, width, type: this.level.world });
      const zone = this.add.rectangle(x, 553, width, 60, color, 0.2).setDepth(4);
      zone.setStrokeStyle(3, color, 0.65);
      this.add.text(x, 550, `${icon} ${label}`, textStyle(14, "#fff7df")).setOrigin(0.5).setDepth(5);
      this.tweens.add({ targets: zone, alpha: 0.38, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  applyLevelGimmick() {
    const gimmick = this.level.gimmick;
    if (["rain", "monsoon", "dike"].includes(gimmick)) {
      for (let i = 0; i < 28; i += 1) {
        const drop = this.add.rectangle(
          Phaser.Math.Between(0, 1280),
          Phaser.Math.Between(95, 700),
          3,
          Phaser.Math.Between(20, 42),
          0xd9f5ff,
          0.48
        ).setScrollFactor(0).setDepth(45).setAngle(14);
        this.tweens.add({
          targets: drop,
          x: drop.x - 140,
          y: 760,
          duration: Phaser.Math.Between(650, 1100),
          delay: Phaser.Math.Between(0, 900),
          repeat: -1
        });
      }
      this.granny.runSpeed += 18;
    }
    if (["desert", "space", "fireworks"].includes(gimmick)) this.granny.body.setGravityY(-320);
    if (["freeway", "coaster", "boss-liberty", "boss-maestro"].includes(gimmick)) this.granny.runSpeed += 45;
    if (["neon", "ghostlights", "mirrors"].includes(gimmick)) {
      for (let i = 0; i < 16; i += 1) {
        const light = this.add.image(
          Phaser.Math.Between(50, 1230),
          Phaser.Math.Between(120, 510),
          "sparkle"
        ).setScrollFactor(0).setDepth(7).setAlpha(0.28).setScale(Phaser.Math.FloatBetween(0.35, 0.8));
        this.tweens.add({ targets: light, alpha: 0.85, angle: 180, duration: 900 + i * 45, yoyo: true, repeat: -1 });
      }
    }
  }

  applyWorldMechanics() {
    const now = this.time.now;
    const zone = this.worldZones.find((candidate) => Math.abs(this.granny.x - candidate.x) < candidate.width / 2);
    if (!zone) return;
    if (zone.type === 2 && !this.granny.body.blocked.down) {
      this.granny.setVelocityX(Math.max(this.granny.body.velocity.x, this.granny.runSpeed + 55));
      this.granny.setAccelerationY(-220);
    } else if (zone.type === 3 && this.granny.body.blocked.down && now > this.mechanicCooldown) {
      this.mechanicCooldown = now + 900;
      this.granny.setVelocityY(-510);
      sound(this, "jump");
    } else if (zone.type === 4) {
      this.granny.setVelocityX(this.granny.runSpeed + 145);
    } else if (zone.type === 5 && !this.granny.body.blocked.down) {
      this.granny.setAccelerationY(-520);
    }
  }

  addPlatform(x, y, width, height, color = this.worldData.ground) {
    if (width <= 0) return null;
    const platform = this.add.rectangle(x + width / 2, y + height / 2, width, height, color);
    platform.setStrokeStyle(5, Phaser.Display.Color.IntegerToColor(color).darken(18).color);
    this.physics.add.existing(platform, true);
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.up = true;
    this.platforms.add(platform);
    this.add.rectangle(x + width / 2, y + 8, width, 16, this.worldData.accent).setDepth(2);
    this.add.rectangle(x + width / 2, y + 19, width - 10, 5, 0xffffff, 0.16).setDepth(3);
    return platform;
  }

  createThief() {
    this.thief = this.add.sprite(690, 505, "thief-run", 0)
      .setDepth(11)
      .setScale(this.level.boss ? 0.29 : 0.25)
      .play("thief-running");
    this.thiefBob = 0;
    this.cageCat = addDetailedCat(this, 640, 455, catFrameForLevel(this.level.id), 0.06).setDepth(12);
  }

  createFinish() {
    const x = this.level.length - 200;
    const g = this.add.graphics().setDepth(6);
    g.fillStyle(0x4b374e).fillRect(x, 280, 18, 310);
    g.fillStyle(0xfff7df).fillRect(x + 18, 292, 140, 64);
    g.fillStyle(COLORS.coral).fillTriangle(x + 158, 292, x + 158, 356, x + 220, 324);
    this.add.text(x + 87, 326, "RESCUE!", textStyle(20, "#2f2335")).setOrigin(0.5).setDepth(7);
  }

  createHUD() {
    const bar = this.add.rectangle(20, 20, 1240, 74, COLORS.ink, 0.9).setOrigin(0).setScrollFactor(0).setDepth(50);
    bar.setStrokeStyle(3, COLORS.cream, 0.9);
    this.add.text(48, 56, `${this.level.id}  ${this.level.title}`, textStyle(25, "#fff7df"))
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    this.coinIcon = this.add.image(790, 56, "coin").setScale(0.55).setScrollFactor(0).setDepth(51);
    this.coinText = this.add.text(825, 58, "0", textStyle(24, "#fff7df")).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    this.treatIcon = this.add.image(900, 56, "treat").setScale(0.48).setScrollFactor(0).setDepth(51);
    this.treatText = this.add.text(937, 58, "0/3", textStyle(24, "#fff7df")).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    this.timeText = this.add.text(1050, 57, "0:00.0", textStyle(24, "#ffdc61")).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    this.progressBg = this.add.rectangle(20, 94, 1240, 8, 0x2f2335, 0.35).setOrigin(0).setScrollFactor(0).setDepth(50);
    this.progress = this.add.rectangle(20, 94, 0, 8, COLORS.coral).setOrigin(0).setScrollFactor(0).setDepth(51);
    this.boostText = this.add.text(640, 158, "⚡ HOOK BOOST", textStyle(18, "#fff7df"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(53).setBackgroundColor("#41b9ad").setPadding(14, 6).setVisible(false);
    const pause = pill(this, 1210, 140, 76, 55, "Ⅱ", { fill: COLORS.cream, size: 24 });
    pause.setScrollFactor(0).setDepth(55).on("pointerup", () => this.togglePause());
    if (this.level.boss) {
      const boss = this.add.text(640, 120, "★  BOSS RUN · WORLD TROPHY  ★", textStyle(18, "#fff7df"))
        .setOrigin(0.5).setScrollFactor(0).setDepth(53).setBackgroundColor("#ec5966").setPadding(16, 6);
      this.tweens.add({ targets: boss, scale: 1.045, duration: 600, yoyo: true, repeat: -1 });
      this.bossHealthText = this.add.text(640, 198, "BOSS  ♥ ♥ ♥", textStyle(18, "#fff7df"))
        .setOrigin(0.5).setScrollFactor(0).setDepth(53).setBackgroundColor("#4a354e").setPadding(14, 5);
    }
  }

  createControls() {
    this.caneButton = this.controlButton(115, 615, 92, "♣", "CANE", COLORS.purple);
    this.jumpButton = this.controlButton(1165, 615, 92, "↑", "JUMP", COLORS.coral);
    this.caneButton.on("pointerdown", () => {
      this.caneHeld = true;
      this.tryLatch();
    });
    this.caneButton.on("pointerup", () => this.releaseCane());
    this.caneButton.on("pointerout", () => this.releaseCane());
    this.jumpButton.on("pointerdown", () => {
      this.jumpHeld = true;
      if (this.granny.jump()) sound(this, "jump");
    });
    this.jumpButton.on("pointerup", () => { this.jumpHeld = false; });
    this.jumpButton.on("pointerout", () => { this.jumpHeld = false; });
  }

  controlButton(x, y, radius, icon, label, color) {
    const shadow = this.add.circle(x, y + 8, radius, 0x2f2335, 0.28).setScrollFactor(0).setDepth(54);
    const circle = this.add.circle(x, y, radius, color, 0.92).setStrokeStyle(6, COLORS.cream).setScrollFactor(0).setDepth(55);
    const iconText = this.add.text(x, y - 12, icon, textStyle(48, "#fff7df")).setOrigin(0.5).setScrollFactor(0).setDepth(56);
    const labelText = this.add.text(x, y + 44, label, textStyle(16, "#fff7df")).setOrigin(0.5).setScrollFactor(0).setDepth(56);
    const hit = this.add.circle(x, y, radius + 10, 0xffffff, 0.001).setInteractive().setScrollFactor(0).setDepth(57);
    hit.on("pointerdown", () => this.tweens.add({ targets: [circle, iconText, labelText], scale: 0.9, duration: 70 }));
    hit.on("pointerup", () => this.tweens.add({ targets: [circle, iconText, labelText], scale: 1, duration: 70 }));
    hit.parts = [shadow, circle, iconText, labelText];
    return hit;
  }

  createIntro() {
    this.granny.frozen = true;
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x2f2335, 0.55).setScrollFactor(0).setDepth(90);
    const card = this.add.rectangle(640, 350, 640, 330, COLORS.cream).setScrollFactor(0).setDepth(91);
    card.setStrokeStyle(7, COLORS.ink);
    const cat = addDetailedCat(this, 640, 270, catFrameForLevel(this.level.id), 0.26).setScrollFactor(0).setDepth(92);
    const title = this.add.text(640, 175, `OH NO — ${this.level.cat.name.toUpperCase()}!`, textStyle(35, "#ec5966"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const sub = this.add.text(640, 365, this.level.subtitle, textStyle(24, "#2f2335")).setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const tipCopy = this.level.boss
      ? `BOSS: HIT 3 GLOWING WEAK SPOTS · DODGE ${this.bossTitle()}`
      : "JUMP TWICE FOR AIR-KICK   •   HOLD CANE NEAR GOLD HOOKS";
    const tip = this.add.text(640, 410, tipCopy, textStyle(17, "#765f78"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(92);
    const go = pill(this, 640, 485, 270, 66, "LET'S ROLL!", { fill: COLORS.yellow, size: 25 });
    go.setScrollFactor(0).setDepth(93);
    const pieces = [shade, card, cat, title, sub, tip, go];
    go.on("pointerup", () => {
      pieces.forEach((piece) => piece.destroy());
      this.granny.frozen = false;
      this.running = true;
      sound(this, "meow");
      sound(this, "jump");
    });
  }

  bindKeys() {
    const keys = this.input.keyboard.addKeys({
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      cane: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      altCane: Phaser.Input.Keyboard.KeyCodes.A,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC
    });
    this.keys = keys;
    keys.jump.on("down", () => {
      this.jumpHeld = true;
      if (this.granny?.jump()) sound(this, "jump");
    });
    keys.jump.on("up", () => { this.jumpHeld = false; });
    keys.up.on("down", () => {
      this.jumpHeld = true;
      if (this.granny?.jump()) sound(this, "jump");
    });
    keys.up.on("up", () => { this.jumpHeld = false; });
    [keys.cane, keys.altCane].forEach((key) => {
      key.on("down", () => { this.caneHeld = true; this.tryLatch(); });
      key.on("up", () => this.releaseCane());
    });
    keys.pause.on("down", () => this.togglePause());
  }

  tryLatch() {
    if (!this.running || this.finished || this.granny.isSwinging) return;
    let nearest = null;
    let distance = 245;
    this.hooks.getChildren().forEach((hook) => {
      const d = Phaser.Math.Distance.Between(this.granny.x, this.granny.y, hook.x, hook.y);
      if (d < distance && hook.x > this.granny.x - 90) {
        nearest = hook;
        distance = d;
      }
    });
    if (nearest) {
      this.granny.latch(nearest);
      this.respawnX = Math.max(this.respawnX, nearest.x - 230);
      sound(this, "cane");
      this.rope = this.add.graphics().setDepth(10);
      this.cameras.main.shake(70, 0.002);
    }
  }

  releaseCane() {
    this.caneHeld = false;
    if (this.granny?.release()) {
      this.rope?.destroy();
      this.rope = null;
      this.boostText?.setVisible(true).setAlpha(1);
      this.tweens.add({ targets: this.boostText, alpha: 0, delay: 1250, duration: 500, onComplete: () => this.boostText?.setVisible(false) });
      for (let i = 0; i < 5; i += 1) {
        const spark = this.add.image(this.granny.x - i * 14, this.granny.y + 30, "sparkle").setScale(0.35).setDepth(16);
        this.tweens.add({ targets: spark, x: spark.x - 80, alpha: 0, duration: 450 + i * 70, onComplete: () => spark.destroy() });
      }
    }
  }

  updateRope() {
    if (!this.rope || !this.granny.hook) return;
    this.rope.clear();
    this.rope.lineStyle(5, 0x6b4129, 1).beginPath()
      .moveTo(this.granny.hook.x, this.granny.hook.y + 22)
      .lineTo(this.granny.x + 20, this.granny.y - 5)
      .strokePath();
  }

  onLand(granny, platform) {
    if (platform.getData("bounce") && granny.body.velocity.y > 100) {
      granny.setVelocityY(-620);
      sound(this, "jump");
    }
    if (granny.x > this.respawnX + 350) this.respawnX = granny.x - 80;
  }

  smashBreakable(granny, object) {
    if (!object.active) return;
    object.disableBody(true, true);
    sound(this, "crash");
    this.cameras.main.shake(130, 0.007);
    granny.setVelocityX(Math.max(granny.body.velocity.x, granny.runSpeed + 35));
    for (let i = 0; i < 8; i += 1) {
      const shard = this.add.rectangle(object.x, object.y, 14, 8, object.getData("type") === "glass" ? 0xc7f5ff : 0xb36e43)
        .setDepth(15);
      this.physics.add.existing(shard);
      shard.body.setVelocity(Phaser.Math.Between(-180, 220), Phaser.Math.Between(-330, -80));
      shard.body.setAngularVelocity(Phaser.Math.Between(-450, 450));
      this.time.delayedCall(1000, () => shard.destroy());
    }
  }

  takeCoin(_granny, coin) {
    coin.disableBody(true, true);
    this.coinsCollected += 1;
    sound(this, "coin");
  }

  takeTreat(_granny, treat) {
    treat.disableBody(true, true);
    this.treatsCollected += 1;
    sound(this, "treat");
    this.cameras.main.flash(90, 255, 220, 95, false);
  }

  updateThief(delta) {
    this.thiefBob += delta * 0.012;
    const bananaHelp = this.save.equippedGear === "bananaBoost" ? 105 : 0;
    const lead = Phaser.Math.Clamp(520 - this.level.id * 12 + this.falls * 75 - bananaHelp, 250, 620);
    const targetX = Math.min(this.level.length - 325, this.granny.x + lead);
    this.thief.x = Phaser.Math.Linear(this.thief.x, targetX, 0.025);
    this.thief.y = 502 + Math.sin(this.thiefBob) * 7;
    this.cageCat.x = this.thief.x - 48;
    this.cageCat.y = this.thief.y - 48;
  }

  updateHUD() {
    this.coinText.setText(String(this.coinsCollected));
    this.treatText.setText(`${this.treatsCollected}/3`);
    const minutes = Math.floor(this.elapsed / 60);
    const seconds = (this.elapsed % 60).toFixed(1).padStart(4, "0");
    this.timeText.setText(`${minutes}:${seconds}`);
    this.progress.width = 1240 * Phaser.Math.Clamp(this.granny.x / (this.level.length - 250), 0, 1);
  }

  parallax() {
    if (this.bgGraphics) this.bgGraphics.x = -this.cameras.main.scrollX * 0.06;
  }

  updateGear() {
    syncGrannyGear(this.grannyGear, this.granny);
    if (this.save.equippedGear !== "magnetBoost") return;
    this.coins.getChildren().forEach((coin) => {
      if (!coin.active) return;
      const distance = Phaser.Math.Distance.Between(this.granny.x, this.granny.y, coin.x, coin.y);
      if (distance < 245) {
        coin.x = Phaser.Math.Linear(coin.x, this.granny.x, 0.16);
        coin.y = Phaser.Math.Linear(coin.y, this.granny.y, 0.16);
      }
    });
  }

  keepPathOpen(delta) {
    if (this.granny.isSwinging || this.granny.body.velocity.x > 95) {
      this.stuckFor = 0;
      return;
    }
    this.stuckFor += delta;
    if (this.stuckFor < 360) return;
    this.stuckFor = 0;
    this.granny.x += 34;
    this.granny.setVelocity(this.granny.runSpeed + 90, -360);
    this.breakables.getChildren().forEach((object) => {
      if (object.active && Math.abs(object.x - this.granny.x) < 120) object.disableBody(true, true);
    });
    this.cameras.main.shake(100, 0.004);
  }

  addSkateDust() {
    if (!this.granny.body.blocked.down || this.time.now - this.lastDustAt < 130) return;
    this.lastDustAt = this.time.now;
    const puff = this.add.circle(
      this.granny.x - 32,
      this.granny.y + 43,
      Phaser.Math.Between(5, 9),
      0xfff7df,
      0.55
    ).setDepth(8);
    this.tweens.add({
      targets: puff,
      x: puff.x - 42,
      y: puff.y - 18,
      alpha: 0,
      scale: 1.8,
      duration: 420,
      onComplete: () => puff.destroy()
    });
  }

  onGrannyLand(impact = 0) {
    this.tweens.killTweensOf(this.granny);
    this.granny.setScale(this.granny.baseScale * 1.13, this.granny.baseScale * 0.87);
    this.tweens.add({
      targets: this.granny,
      scaleX: this.granny.baseScale,
      scaleY: this.granny.baseScale,
      duration: 180,
      ease: "Back.out"
    });
    this.cameras.main.shake(80, Phaser.Math.Clamp(impact / 160000, 0.0015, 0.004));
    this.cameras.main.zoomTo(1.018, 70, Phaser.Math.Easing.Quadratic.Out, false, (_camera, progress) => {
      if (progress === 1) this.cameras.main.zoomTo(1, 150, Phaser.Math.Easing.Back.Out);
    });
    sound(this, "land");
    for (let i = 0; i < 6; i += 1) {
      const debris = this.add.circle(this.granny.x + Phaser.Math.Between(-25, 25), this.granny.y + 46, Phaser.Math.Between(2, 5), 0xe7d5aa, 0.7).setDepth(17);
      this.tweens.add({
        targets: debris,
        x: debris.x + Phaser.Math.Between(-55, 55),
        y: debris.y - Phaser.Math.Between(18, 55),
        alpha: 0,
        duration: Phaser.Math.Between(280, 480),
        ease: "Quad.out",
        onComplete: () => debris.destroy()
      });
    }
  }

  createReactiveProps() {
    this.reactiveProps = [];
    for (let x = 520, index = 0; x < this.level.length - 300; x += 780, index += 1) {
      const color = this.level.world === 2 ? (index % 2 ? 0xf05d6b : 0xffcc4d) : this.level.world === 3 ? 0xe85d65 : 0x6fa457;
      const stem = this.add.rectangle(0, 9, 5, 30, 0x4e8b50);
      const bloom = this.add.circle(0, -9, this.level.world === 2 ? 9 : 12, color);
      const prop = this.add.container(x, 555, [stem, bloom]).setDepth(7);
      prop.setData("triggered", false);
      this.reactiveProps.push(prop);
    }
  }

  createBossEncounter() {
    this.bossHealth = 3;
    this.bossPhase = 0;
    this.nextBossAttack = this.time.now + 1800;
    this.bossWeakPoints = this.physics.add.group({ allowGravity: false, immovable: true });
    this.bossProjectiles = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.granny, this.bossWeakPoints, this.hitBoss, undefined, this);
    this.physics.add.overlap(this.granny, this.bossProjectiles, this.hitByBoss, undefined, this);
    this.bossPhasePositions = [0.32, 0.59, 0.83].map((ratio) => Math.round(this.level.length * ratio));
    const colors = [0x6d9b54, 0x53a6b6, 0xd55b68, 0xd06749, 0x8f5ab1];
    const bossColor = colors[this.level.world - 1];
    const parts = [
      this.add.ellipse(0, 15, 190, 125, bossColor).setStrokeStyle(8, COLORS.ink),
      this.add.circle(-42, -5, 20, 0xfff3d0).setStrokeStyle(5, COLORS.ink),
      this.add.circle(42, -5, 20, 0xfff3d0).setStrokeStyle(5, COLORS.ink),
      this.add.circle(-42, -5, 7, 0x2f2335),
      this.add.circle(42, -5, 7, 0x2f2335),
      this.add.rectangle(0, 48, 88, 18, 0x34293a).setStrokeStyle(3, 0xffd45f)
    ];
    if (this.level.world === 2) {
      const bladeA = this.add.rectangle(0, -80, 14, 170, 0xfff1d3);
      const bladeB = this.add.rectangle(0, -80, 14, 170, 0xfff1d3).setAngle(90);
      const hub = this.add.circle(0, -80, 20, 0xf0b944).setStrokeStyle(5, COLORS.ink);
      this.tweens.add({ targets: [bladeA, bladeB], angle: "+=360", duration: 1800, repeat: -1 });
      parts.unshift(bladeA, bladeB, hub);
    } else if (this.level.world === 3) {
      parts.push(this.add.triangle(-88, 0, 0, 20, 45, -45, 70, 35, 0xe9c24e));
      parts.push(this.add.triangle(88, 0, 0, 20, -45, -45, -70, 35, 0xe9c24e));
    } else if (this.level.world === 4) {
      parts.push(this.add.triangle(0, -95, -45, 20, 0, -65, 45, 20, 0xe9eef0));
      parts.push(this.add.triangle(0, 95, -30, -15, 0, 50, 30, -15, 0xffc84e));
    } else if (this.level.world === 5) {
      parts.push(this.add.rectangle(0, -82, 100, 30, 0x33243d));
      parts.push(this.add.rectangle(0, -120, 70, 75, 0x33243d));
      parts.push(this.add.text(0, 82, "♫", textStyle(36, "#ffdc63")).setOrigin(0.5));
    }
    this.bossVisual = this.add.container(this.bossPhasePositions[0] + 250, 320, parts).setDepth(20);
    this.tweens.add({ targets: this.bossVisual, y: 300, angle: 2.5, duration: 620, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.bossName = this.add.text(this.bossVisual.x, 205, this.bossTitle(), textStyle(18, "#fff7df"))
      .setOrigin(0.5).setDepth(22).setBackgroundColor("#3b2c40").setPadding(12, 5);
    this.spawnBossWeakPoint();
  }

  bossTitle() {
    return ["THE HEDGE CRUSHER", "STORMMILL MAX", "NEON DRAGON", "ROCKET BANDIT", "MAESTRO MECH"][this.level.world - 1];
  }

  spawnBossWeakPoint() {
    const x = this.bossPhasePositions[this.bossPhase] || this.level.length - 250;
    const y = [430, 355, 405][this.bossPhase] || 460;
    const weak = this.bossWeakPoints.create(x, y, "sparkle").setScale(1.8);
    weak.body.setAllowGravity(false);
    weak.body.setImmovable(true);
    weak.setData("phase", this.bossPhase);
    this.activeWeakPoint = weak;
    this.tweens.add({ targets: weak, scale: 2.35, angle: 180, duration: 520, yoyo: true, repeat: -1 });
  }

  hitBoss(_granny, weak) {
    if (!weak.active || this.finished) return;
    weak.disableBody(true, true);
    this.bossHealth -= 1;
    this.bossPhase += 1;
    this.bossHealthText?.setText(`BOSS  ${"♥ ".repeat(this.bossHealth)}${"· ".repeat(3 - this.bossHealth)}`);
    this.cameras.main.shake(260, 0.013);
    sound(this, "boss");
    this.tweens.add({
      targets: this.bossVisual,
      x: this.bossVisual.x + 80,
      angle: 14,
      scale: 0.82,
      duration: 110,
      yoyo: true,
      ease: "Back.out"
    });
    for (let i = 0; i < 14; i += 1) {
      const spark = this.add.image(weak.x, weak.y, "sparkle").setScale(Phaser.Math.FloatBetween(0.2, 0.55)).setDepth(25);
      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-120, 120),
        y: spark.y + Phaser.Math.Between(-100, 80),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(350, 700),
        onComplete: () => spark.destroy()
      });
    }
    if (this.bossHealth > 0) this.spawnBossWeakPoint();
    else {
      this.bossHealthText?.setText("BOSS  DEFEATED!");
      this.tweens.add({
        targets: [this.bossVisual, this.bossName],
        y: 780,
        angle: 35,
        alpha: 0,
        duration: 1100,
        ease: "Quad.in"
      });
    }
  }

  updateBossEncounter() {
    if (!this.level.boss || !this.bossVisual || this.bossHealth <= 0) return;
    const weak = this.activeWeakPoint;
    if (weak?.active && this.granny.x > weak.x + 180) {
      weak.setPosition(Math.min(this.level.length - 230, this.granny.x + 300), 470 - this.bossHealth * 25);
    }
    const targetX = (weak?.active ? weak.x : this.granny.x + 350) + 230;
    this.bossVisual.x = Phaser.Math.Linear(this.bossVisual.x, targetX, 0.035);
    this.bossName.x = this.bossVisual.x;
    if (this.time.now >= this.nextBossAttack && this.bossVisual.x - this.granny.x < 900) {
      this.nextBossAttack = this.time.now + Math.max(900, 2100 - this.bossPhase * 320);
      const texture = ["crate", "tulip-cart", "lantern-gate", "road-barrier", "carnival-drum"][this.level.world - 1];
      const projectile = this.bossProjectiles.create(this.bossVisual.x - 80, 480 - (this.bossPhase % 2) * 105, texture)
        .setScale(texture === "crate" ? 0.58 : 0.48);
      projectile.body.setAllowGravity(false);
      projectile.setVelocityX(-260 - this.bossPhase * 45);
      projectile.setAngularVelocity(this.bossPhase % 2 ? -210 : 210);
      this.time.delayedCall(4200, () => projectile?.destroy());
      const warning = this.add.text(this.granny.x + 430, 250, "!", textStyle(34, "#fff7df"))
        .setOrigin(0.5).setDepth(28).setBackgroundColor("#ec5966").setPadding(10, 2);
      this.tweens.add({ targets: warning, y: 230, alpha: 0, duration: 600, onComplete: () => warning.destroy() });
    }
  }

  hitByBoss(_granny, projectile) {
    if (!projectile.active) return;
    projectile.destroy();
    this.falls += 1;
    this.granny.setVelocity(this.granny.runSpeed * 0.55, -330);
    this.cameras.main.shake(220, 0.011);
    this.cameras.main.flash(120, 236, 89, 102);
    sound(this, "crash");
  }

  updateReactiveProps() {
    this.reactiveProps?.forEach((prop) => {
      if (prop.getData("triggered") || Math.abs(prop.x - this.granny.x) > 75) return;
      prop.setData("triggered", true);
      this.tweens.add({
        targets: prop,
        angle: this.granny.x < prop.x ? 34 : -34,
        scaleY: 0.65,
        duration: 90,
        yoyo: true,
        ease: "Back.out",
        onComplete: () => prop.setData("triggered", false)
      });
      const leaf = this.add.circle(prop.x, prop.y - 18, 5, 0x73a75d, 0.8).setDepth(18);
      this.tweens.add({ targets: leaf, x: leaf.x + 55, y: leaf.y - 45, angle: 180, alpha: 0, duration: 600, onComplete: () => leaf.destroy() });
    });
  }

  fall() {
    if (this.finished) return;
    this.respawnX = Math.max(this.respawnX, this.granny.x + 75);
    this.falls += 1;
    if (Math.abs(this.respawnX - this.lastFallCheckpoint) < 100) this.repeatFallCount += 1;
    else this.repeatFallCount = 0;
    this.lastFallCheckpoint = this.respawnX;
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(180, 236, 89, 102);
    this.releaseCane();
    this.granny.body.enable = false;
    this.running = false;
    const recovery = this.save.equippedGear === "helmetBoost" ? 180 : 430;
    this.time.delayedCall(recovery, () => {
      const mercyBoost = Math.min(this.repeatFallCount * 120, 260);
      this.granny.setPosition(Math.max(140, this.respawnX + mercyBoost), 450);
      this.granny.setAngle(0);
      this.granny.body.enable = true;
      this.granny.body.allowGravity = true;
      this.granny.setVelocity(250, 0);
      this.running = true;
    });
  }

  complete() {
    if (this.finished) return;
    this.finished = true;
    this.running = false;
    this.granny.frozen = true;
    this.granny.setVelocity(0, 0);
    this.thief.setVisible(false);
    this.cageCat?.setVisible(false);
    sound(this, this.level.boss ? "boss" : "win");
    this.cameras.main.flash(300, 255, 245, 190);

    const paws = 1 + (this.treatsCollected === 3 ? 1 : 0) + (this.elapsed <= this.level.targetTime || this.falls === 0 ? 1 : 0);
    const result = {
      coins: this.coinsCollected,
      treats: this.treatsCollected,
      time: Number(this.elapsed.toFixed(1)),
      falls: this.falls,
      paws
    };
    const { firstClear } = SaveGame.completeLevel(this.level, result);
    this.registry.set("save", SaveGame.load());
    this.time.delayedCall(350, () => this.resultPanel(result, firstClear));
  }

  resultPanel(result, firstClear) {
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x2f2335, 0.76).setScrollFactor(0).setDepth(100);
    const panel = this.add.rectangle(640, 354, 760, 590, COLORS.cream).setScrollFactor(0).setDepth(101);
    panel.setStrokeStyle(8, COLORS.ink);
    const cat = addDetailedCat(this, 640, 220, catFrameForLevel(this.level.id), 0.27).setScrollFactor(0).setDepth(102);
    this.tweens.add({ targets: cat, y: 205, angle: 4, duration: 500, yoyo: true, repeat: -1 });
    const resultTitle = this.level.id === 45 ? "ALL CATS HOME!" : this.level.boss ? "WORLD SAVED!" : "CAT RESCUED!";
    this.add.text(640, 105, resultTitle, textStyle(43, "#ec5966")).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    const rescueCopy = this.level.id === 45
      ? `🏆 GRAND CHAMPION · ${this.level.cat.name} completes the Cat House!`
      : this.level.boss
      ? `🏆 ${this.worldData.name} trophy earned · ${this.level.cat.name} is safe!`
      : firstClear
        ? `${this.level.cat.name} moved into the Cat House!`
        : `${this.level.cat.name} is safe again.`;
    this.add.text(640, 287, rescueCopy, textStyle(23))
      .setOrigin(0.5).setScrollFactor(0).setDepth(102);
    this.add.text(640, 337, "🐾".repeat(result.paws) + "·".repeat(3 - result.paws), textStyle(41, "#f2a532"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(102);

    const stats = [
      ["COINS", `${result.coins}`],
      ["TREATS", `${result.treats}/3`],
      ["TIME", `${result.time.toFixed(1)}s`],
      ["FALLS", `${result.falls}`]
    ];
    stats.forEach(([label, value], index) => {
      const x = 390 + index * 165;
      this.add.text(x, 405, label, textStyle(15, "#847486")).setOrigin(0.5).setScrollFactor(0).setDepth(102);
      this.add.text(x, 441, value, textStyle(27)).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    });

    const retry = pill(this, 410, 550, 210, 62, "↻  RETRY", { fill: COLORS.cream, size: 21 });
    const nextLabel = this.level.id >= 45 ? "VICTORY MAP" : this.level.boss ? "NEXT WORLD →" : "NEXT  →";
    const next = pill(this, 640, 550, 220, 62, nextLabel, { fill: COLORS.yellow, size: 19 });
    const home = pill(this, 870, 550, 210, 62, "CAT HOUSE", { fill: COLORS.teal, color: "#fff7df", size: 20 });
    [retry, next, home].forEach((button) => button.setScrollFactor(0).setDepth(103));
    retry.on("pointerup", () => this.scene.restart({ levelId: this.level.id }));
    next.on("pointerup", () => this.level.id < 45
      ? this.scene.start("GameScene", { levelId: this.level.id + 1 })
      : this.scene.start("LevelSelect"));
    home.on("pointerup", () => this.scene.start("CatHouse", { page: this.level.world }));
    shade.setInteractive();
  }

  togglePause() {
    if (this.finished) return;
    if (this.pausePanel) {
      this.pausePanel.forEach((item) => item.destroy());
      this.pausePanel = null;
      this.physics.resume();
      this.running = true;
      return;
    }
    this.running = false;
    this.physics.pause();
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x2f2335, 0.65).setScrollFactor(0).setDepth(110);
    const panel = this.add.rectangle(640, 350, 470, 330, COLORS.cream).setScrollFactor(0).setDepth(111);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 250, "SKATE BREAK", textStyle(38)).setOrigin(0.5).setScrollFactor(0).setDepth(112);
    const resume = pill(this, 640, 345, 280, 65, "KEEP ROLLING", { fill: COLORS.yellow, size: 23 });
    const map = pill(this, 640, 430, 280, 60, "BACK TO MAP", { fill: COLORS.cream, size: 21 });
    [resume, map].forEach((button) => button.setScrollFactor(0).setDepth(113));
    this.pausePanel = [shade, panel, title, resume, map];
    resume.on("pointerup", () => this.togglePause());
    map.on("pointerup", () => {
      this.physics.resume();
      this.scene.start("LevelSelect");
    });
  }
}
