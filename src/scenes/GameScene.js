import { Granny } from "../objects/Granny.js";
import { addCoin, addTreat } from "../objects/Collectibles.js";
import {
  catFrameForLevel,
  createCat,
  createGrannyGear,
  syncGrannyGear
} from "../visual/VisualFactory.js";
import { levelById, worldById } from "../levels/levels.js";
import { planCourse } from "../levels/CoursePlanner.js";
import { PHYSICS_TUNING } from "../config/PhysicsTuning.js";
import { performanceProfile } from "../systems/PerformanceProfile.js";
import { DevTools } from "../systems/DevTools.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { COLORS, pill, sound, textStyle } from "../ui/ui.js";
import { BossEncounter } from "./game/BossEncounter.js";
import { ResultsPanel } from "./game/ResultsPanel.js";
import { RunHud } from "./game/RunHud.js";
import { WorldMechanics } from "./game/WorldMechanics.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.level = levelById(data.levelId);
    this.worldData = worldById(this.level.world);
    this.chapterStep = ((this.level.worldStep - 1) % 2) + 1;
    const chapterReward = levelById(this.level.grantsCat ? this.level.id : this.level.id + 1);
    this.chapterCatLevel = !this.level.boss && !chapterReward.boss ? chapterReward : null;
    this.coinsCollected = 0;
    this.treatsCollected = 0;
    this.falls = 0;
    this.elapsed = 0;
    this.running = false;
    this.finished = false;
    this.lost = false;
    this.jumpHeld = false;
    this.caneHeld = false;
    this.respawnX = 170;
    this.stuckFor = 0;
    this.lastDustAt = 0;
    this.lastFallCheckpoint = -999;
    this.repeatFallCount = 0;
    this.thiefFinishTime = 0;
    this.finishX = this.level.length - 260;
    this.performance = performanceProfile(SaveGame.load().performanceMode);
    this.lastPhysicsCullAt = 0;
    this.adminTest = Boolean(data?.adminTest);
    this.adminTimeScale = Phaser.Math.Clamp(Number(data?.adminTimeScale) || 1, 0.1, 1);
    this.adminHitboxes = Boolean(data?.adminHitboxes);
    this.skipIntro = Boolean(data?.skipIntro);
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
    this.worldMechanics = new WorldMechanics(this);
    this.makeCourse();
    this.createWorldMechanics();

    this.granny = new Granny(this, 150, 500);
    this.granny.runSpeed = 305 + this.level.id * 6;
    this.escapeLimit = this.level.targetTime * (1.43 - this.level.world * 0.035);
    this.maxFalls = Math.max(3, 6 - this.level.world);
    this.save = SaveGame.load();
    if (this.save.equippedGear === "yarnBoost") this.granny.runSpeed += 38;
    this.grannyGear = createGrannyGear(this, this.granny, this.save.equippedGear, 14);
    this.applyLevelGimmick();
    this.physics.add.collider(this.granny, this.platforms, this.onLand, undefined, this);
    this.physics.add.collider(this.granny, this.breakables, this.smashBreakable, undefined, this);
    this.physics.add.overlap(this.granny, this.coins, this.takeCoin, undefined, this);
    this.physics.add.overlap(this.granny, this.treats, this.takeTreat, undefined, this);

    const camera = PHYSICS_TUNING.camera;
    this.cameras.main.startFollow(
      this.granny,
      true,
      camera.lerpX,
      camera.lerpY,
      camera.followOffsetX,
      camera.followOffsetY
    );
    this.cameras.main.setDeadzone(camera.deadzoneWidth, camera.deadzoneHeight);
    this.events.on("granny-land", this.onGrannyLand, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off("granny-land", this.onGrannyLand, this));
    this.createThief();
    this.createCatSoundMoments();
    this.createFinish();
    this.runHud = new RunHud(this);
    this.resultsPanel = new ResultsPanel(this);
    this.createHUD();
    this.createControls();
    this.createReactiveProps();
    this.createEffectPool();
    this.createSpeedLines();
    if (this.level.boss) this.createBossEncounter();
    this.createIntro();
    this.bindKeys();
    this.devTools = new DevTools(this);
    if (this.adminTest) {
      this.devTools.setTimeScale(this.adminTimeScale);
      if (this.adminHitboxes) this.devTools.toggleHitboxes();
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.devTools?.destroy());
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
    this.updateSpeedLines();
    this.updateOffscreenPhysics();
    this.devTools?.update();

    if (this.elapsed >= this.escapeLimit) this.lose("time");
    if (this.finished) return;
    if (this.granny.y > 760 || this.granny.x < this.cameras.main.scrollX - 130) this.fall();
    if (this.granny.x >= this.finishX) {
      if (this.level.boss && this.bossHealth > 0) {
        this.granny.x = this.level.length - 330;
        this.granny.setVelocityX(120);
        if (this.activeWeakPoint?.active) this.activeWeakPoint.setPosition(this.level.length - 230, 485);
      } else this.complete();
    }
  }

  drawBackground() {
    const world = this.level.world;
    this.backgroundOffset = ((this.level.id - 1) % 9) * 137;
    this.skyLayer = this.add.tileSprite(0, 0, 1280, 720, `world-bg-${world}`)
      .setOrigin(0).setScrollFactor(0).setDepth(-20).setAlpha(0.94);
    this.skyLayer.tilePositionX = this.backgroundOffset;
    const g = this.add.graphics().setDepth(-18).setAlpha(0.06);
    g.fillStyle(this.worldData.sky, 0.2).fillRect(0, 0, this.level.length, 720);
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
    const course = planCourse(this.level);
    const { gaps, raised, hooks, obstacles, coins, awnings } = course;
    let cursor = 0;
    for (const [start, end] of gaps) {
      this.addPlatform(cursor, 590, start - cursor, 160);
      cursor = end;
    }
    this.addPlatform(cursor, 590, length - cursor + 500, 160);

    raised.forEach(([x, y, width], index) => {
      if (x < length - 300) this.addPlatform(x, y, width, 34, index % 2 ? 0xc97b54 : 0xf2c56e);
    });

    hooks.forEach((point) => {
      const hook = this.add.image(point.x, point.y, "hook").setDepth(8);
      hook.setData("used", false);
      hook.setData("required", point.required);
      hook.setData("reason", point.reason || "gap");
      if (point.required) {
        hook.setScale(1.12).setTint(0xffe17a);
        this.tweens.add({ targets: hook, scale: 1.22, duration: 650, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else if (point.reason === "obstacle") {
        hook.setScale(1.04).setTint(0x9ff3e6);
        this.tweens.add({ targets: hook, y: hook.y - 5, duration: 820, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }
      this.hooks.add(hook);
    });

    obstacles.forEach(({ x, texture }) => {
      const config = this.obstacleConfig(texture);
      const obstacle = this.breakables.create(x, config.y, texture);
      const scale = config.scale;
      obstacle.setScale(scale).refreshBody();
      obstacle.setData("type", texture);
    });

    coins.forEach(({ x, y }) => addCoin(this, x, y, this.coins));
    this.courseGaps = gaps;
    this.obstacleXs = obstacles.map((entry) => entry.x);
    this.raisedPlatforms = raised;

    [
      [Math.round(length * 0.18), 350],
      [Math.round(length * 0.52), 300],
      [Math.round(length * 0.86), 285]
    ].forEach(([x, y]) => addTreat(this, x, y, this.treats));

    awnings.forEach(({ x, y, width }) => {
      const awning = this.addPlatform(x, y, width, 24, 0xe85e68);
      awning.setData("bounce", true);
    });
  }

  createWorldMechanics() {
    this.worldMechanics.createWorldMechanics();
  }

  applyLevelGimmick() {
    this.worldMechanics.applyLevelGimmick();
  }

  applyWorldMechanics() {
    this.worldMechanics.applyWorldMechanics();
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
    this.add.rectangle(x + width / 2, y + 10, width, 20, this.worldData.accent).setDepth(2);
    this.add.rectangle(x + width / 2, y + 20, width - 8, 6, 0xffffff, 0.2).setDepth(3);
    this.add.rectangle(x + width / 2, y + 30, width, 12, 0x201727, 0.12).setDepth(2);
    const texture = this.add.graphics().setDepth(2);
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(24).color;
    const light = Phaser.Display.Color.IntegerToColor(color).lighten(18).color;
    const isRaised = height < 80;
    if (isRaised) {
      texture.fillStyle(dark, 0.38).fillRoundedRect(x + 7, y + height - 9, width - 14, 9, 4);
      texture.fillStyle(light, 0.3).fillRoundedRect(x + 9, y + 5, Math.max(12, width - 18), 5, 3);
      texture.fillStyle(dark, 0.5)
        .fillRoundedRect(x + 6, y + 2, 12, height + 14, 4)
        .fillRoundedRect(x + width - 18, y + 2, 12, height + 14, 4);
      if (width > 170) {
        texture.fillStyle(dark, 0.28).fillRoundedRect(x + width / 2 - 5, y + height - 2, 10, 48, 4);
      }
    }
    for (let offset = 12, tile = 0; offset < width - 8; offset += 72, tile += 1) {
      texture.fillStyle(tile % 2 ? dark : light, 0.22)
        .fillRoundedRect(x + offset, y + 39 + (tile % 3) * 9, Math.min(55, width - offset), 14, 5);
      texture.lineStyle(2, dark, 0.24).beginPath()
        .moveTo(x + offset + 4, y + 58).lineTo(x + offset + 19, y + 64).strokePath();
      if (width > 520 && offset > 140 && offset < width - 140 && tile % 4 === 0) {
        texture.lineStyle(3, dark, 0.2).beginPath()
          .moveTo(x + offset - 10, y + 4)
          .lineTo(x + offset - 10, y + Math.min(height - 8, 128))
          .strokePath();
      }
      if (this.level.world === 2 && tile % 3 === 0) {
        texture.fillStyle(0xe7d9a6, 0.45).fillCircle(x + offset + 28, y + 34, 3);
      } else if (this.level.world === 5 && tile % 2 === 0) {
        texture.fillStyle(0xffd660, 0.5).fillCircle(x + offset + 29, y + 48, 3);
      } else if (this.level.world === 3 && tile % 3 === 1) {
        texture.fillStyle(0xffcc55, 0.42).fillRoundedRect(x + offset + 18, y + 45, 24, 5, 2);
      } else if (this.level.world === 4 && tile % 3 === 2) {
        texture.fillStyle(0xf7df65, 0.38).fillRect(x + offset + 18, y + 42, 28, 4);
      }
    }
    return platform;
  }

  obstacleConfig(texture) {
    const settings = {
      crate: { height: 86, scale: 1.02 },
      glass: { height: 112, scale: 0.98 },
      bicycle: { height: 82, scale: 0.98 },
      "tulip-cart": { height: 92, scale: 1.02 },
      "lantern-gate": { height: 120, scale: 0.92 },
      "road-barrier": { height: 74, scale: 1.08 },
      "carnival-drum": { height: 88, scale: 1.05 }
    };
    const config = settings[texture] || { height: 90, scale: 1 };
    return {
      ...config,
      y: 590 - (config.height * config.scale) / 2
    };
  }

  createThief() {
    this.thiefProgress = 690;
    this.thiefSpeed = this.granny.runSpeed - 30 + this.level.id * 0.4 + (this.level.boss ? 8 : 0);
    this.thief = this.add.sprite(this.thiefProgress, 505, "thief-run", 0)
      .setDepth(11)
      .setScale(this.level.boss ? 0.29 : 0.25)
      .play("thief-running");
    this.thiefRope = this.add.graphics().setDepth(10);
    this.thiefBob = 0;
    this.thiefJump = null;
    this.nextThiefReaction = 0;
    this.thiefReaction = this.add.text(this.thiefProgress, 400, "!", textStyle(24, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(22)
      .setBackgroundColor("#ec5966")
      .setPadding(8, 2)
      .setVisible(false);
    const catFrame = this.chapterCatLevel ? this.chapterCatLevel.id : this.level.id;
    this.cageCat = createCat(this, 640, 455, catFrameForLevel(catFrame), 0.06).setDepth(12);
    if (!this.chapterCatLevel) this.cageCat.setTint(0x4b3b50).setAlpha(0.78);
  }

  createCatSoundMoments() {
    this.time.addEvent({
      delay: Phaser.Math.Between(7200, 11200),
      loop: true,
      callback: () => {
        if (!this.running || this.finished || !this.cageCat?.visible) return;
        sound(this, Math.random() > 0.45 ? "meow2" : "chirp");
        this.tweens.add({
          targets: this.cageCat,
          y: this.cageCat.y - 6,
          angle: this.cageCat.angle + 3,
          duration: 140,
          yoyo: true,
          ease: "Sine.inOut"
        });
      }
    });
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
    this.runHud.create();
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
    if (this.adminTest || this.skipIntro) {
      this.granny.frozen = false;
      this.running = true;
      return;
    }
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x2f2335, 0.55).setScrollFactor(0).setDepth(90);
    const card = this.add.rectangle(640, 350, 640, 330, COLORS.cream).setScrollFactor(0).setDepth(91);
    card.setStrokeStyle(7, COLORS.ink);
    const shownLevel = this.chapterCatLevel || this.level;
    const cat = createCat(this, 640, 270, catFrameForLevel(shownLevel.id), 0.26).setScrollFactor(0).setDepth(92);
    if (!this.chapterCatLevel) {
      cat.setTint(0x493b51).setAlpha(0.72);
    }
    const introTitle = this.level.boss
      ? "BOSS RUN — MYSTERY CATBOX!"
      : this.level.grantsCat
        ? `FINAL CHASE — SAVE ${shownLevel.cat.name.toUpperCase()}!`
        : `CHASE ${this.chapterStep}/2 — KEEP UP!`;
    const title = this.add.text(640, 175, introTitle, textStyle(35, "#ec5966"))
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
      const hookGap = this.courseGaps.find(([start, end, required]) => required && nearest.x > start && nearest.x < end);
      const safeCheckpoint = hookGap ? hookGap[0] - 145 : nearest.x - 230;
      this.respawnX = Math.max(this.respawnX, safeCheckpoint);
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
      const quality = this.granny.lastHookQuality;
      const boostLabel = quality > 1.25
        ? "⚡ PERFECT SWING!"
        : quality > 0.75
          ? "⚡ GREAT RELEASE!"
          : "⚡ HOOK BOOST";
      this.boostText?.setText(boostLabel).setVisible(true).setAlpha(1);
      this.tweens.add({ targets: this.boostText, alpha: 0, delay: 1250, duration: 500, onComplete: () => this.boostText?.setVisible(false) });
      this.cameras.main.zoomTo(1.018, 100, Phaser.Math.Easing.Quadratic.Out, false, (_camera, progress) => {
        if (progress === 1) this.cameras.main.zoomTo(1, 260, Phaser.Math.Easing.Sine.Out);
      });
      this.reactThief("EEK!");
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

  safeThiefLanding(startX, proposedX) {
    let landingX = proposedX;
    for (let pass = 0; pass < 4; pass += 1) {
      const nearbyGap = this.courseGaps.find(([start, end]) => end > startX && start < landingX + 75 && end + 100 > landingX);
      if (nearbyGap) landingX = nearbyGap[1] + 100;
      const nearbyObstacle = this.breakables.getChildren()
        .find((object) => object.active && object.x > startX && object.x < landingX + 75 && object.x + 145 > landingX);
      if (nearbyObstacle) landingX = nearbyObstacle.x + 145;
    }
    return landingX;
  }

  planThiefAvoidance() {
    if (this.thiefJump) return;
    const gap = this.courseGaps.find(([start]) => start > this.thiefProgress && start - this.thiefProgress < 145);
    const obstacle = this.breakables.getChildren()
      .filter((object) => object.active && object.x > this.thiefProgress)
      .sort((a, b) => a.x - b.x)[0];
    const obstacleAhead = obstacle && obstacle.x - this.thiefProgress < 115 ? obstacle : null;
    const gapDistance = gap ? gap[0] - this.thiefProgress : Infinity;
    const obstacleDistance = obstacleAhead ? obstacleAhead.x - this.thiefProgress : Infinity;

    if (gapDistance < obstacleDistance) {
      const [start, end, required] = gap;
      const landingX = this.safeThiefLanding(this.thiefProgress, end + 100);
      const grappleGap = required
        ? gap
        : this.courseGaps.find(([gapStart, gapEnd, needsHook]) => needsHook
          && gapStart > this.thiefProgress && gapEnd < landingX);
      const routeHook = grappleGap
        ? this.hooks.getChildren().find((hook) => hook.x > grappleGap[0] && hook.x < grappleGap[1])
        : null;
      this.thiefJump = {
        type: grappleGap ? "grapple-gap" : "gap",
        startX: this.thiefProgress,
        endX: landingX,
        height: grappleGap ? 195 : 145,
        hookX: routeHook?.x,
        hookY: routeHook?.y
      };
    } else if (obstacleAhead) {
      const landingX = this.safeThiefLanding(this.thiefProgress, obstacleAhead.x + 145);
      const grappleGap = this.courseGaps.find(([gapStart, gapEnd, needsHook]) => needsHook
        && gapStart > this.thiefProgress && gapEnd < landingX);
      const routeHook = grappleGap
        ? this.hooks.getChildren().find((hook) => hook.x > grappleGap[0] && hook.x < grappleGap[1])
        : null;
      this.thiefJump = {
        type: grappleGap ? "grapple-gap" : "obstacle",
        startX: this.thiefProgress,
        endX: landingX,
        height: grappleGap ? 195 : 125,
        hookX: routeHook?.x,
        hookY: routeHook?.y
      };
    }
  }

  updateThief(delta) {
    this.thiefBob += delta * 0.012;
    const bananaSlow = this.save.equippedGear === "bananaBoost" ? 58 : 0;
    const pressureBoost = this.granny.x > this.thiefProgress - 175 ? 28 : 0;
    const speed = Math.max(235, this.thiefSpeed - bananaSlow + pressureBoost);
    this.planThiefAvoidance();
    this.thiefProgress += speed * Math.min(delta / 1000, 0.04);
    const finish = this.finishX;
    const bossGate = this.level.length - 500;
    this.thiefProgress = Math.min(this.thiefProgress, this.level.boss && this.bossHealth > 0 ? bossGate : finish);
    this.thief.x = this.thiefProgress;
    this.thiefRope.clear();
    if (this.thiefJump) {
      const jumpProgress = Phaser.Math.Clamp(
        (this.thiefProgress - this.thiefJump.startX) / (this.thiefJump.endX - this.thiefJump.startX),
        0,
        1
      );
      const arc = Math.sin(jumpProgress * Math.PI);
      this.thief.y = 502 - arc * this.thiefJump.height;
      this.thief.setAngle(Math.sin(jumpProgress * Math.PI * 2) * 7);
      this.thief.anims.timeScale = this.thiefJump.type === "grapple-gap" ? 0.68 : 0.82;
      if (this.thiefJump.type === "grapple-gap" && this.thiefJump.hookX && jumpProgress < 0.82) {
        this.thiefRope.lineStyle(3, 0x423039, 0.9).beginPath()
          .moveTo(this.thiefJump.hookX, this.thiefJump.hookY + 16)
          .lineTo(this.thief.x - 8, this.thief.y - 24)
          .strokePath();
      }
      if (jumpProgress >= 1) {
        this.thiefJump = null;
        this.thief.setAngle(0);
      }
    } else {
      this.thief.y = 502 + Math.sin(this.thiefBob) * 7;
      this.thief.setAngle(0);
      this.thief.anims.timeScale = Phaser.Math.Clamp(speed / 300, 0.78, 1.18);
    }
    this.cageCat.x = this.thief.x - 48;
    this.cageCat.y = this.thief.y - 48;
    this.thiefReaction.setPosition(this.thief.x, this.thief.y - 105);
    const chaseGap = this.thiefProgress - this.granny.x;
    if (chaseGap < 190 && this.time.now > this.nextThiefReaction) {
      this.nextThiefReaction = this.time.now + 2400;
      this.reactThief(chaseGap < 90 ? "NO!" : "!");
    }

    if (this.thiefProgress >= finish - 1 && (!this.level.boss || this.bossHealth <= 0)) {
      this.lose("thief");
    }
  }

  updateHUD() {
    this.runHud.update();
  }

  parallax() {
    if (this.skyLayer) this.skyLayer.tilePositionX = this.backgroundOffset + this.cameras.main.scrollX * 0.12;
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
    if (!this.granny.body.blocked.down || this.time.now - this.lastDustAt < this.performance.dustInterval) return;
    this.lastDustAt = this.time.now;
    this.emitEffectCircle(
      this.granny.x - 32,
      this.granny.y + 43,
      Phaser.Math.Between(5, 9),
      0xfff7df,
      0.55,
      8,
      {
      x: this.granny.x - 74,
      y: this.granny.y + 25,
      alpha: 0,
      scale: 1.8,
      duration: 420
      }
    );
  }

  onGrannyLand(impact = 0) {
    // Never squash the physics sprite itself: scaling its body creates false
    // airborne/landing loops. Landing weight comes from camera and pooled debris.
    if (impact > 420) {
      this.cameras.main.shake(55, Phaser.Math.Clamp(impact / 240000, 0.001, 0.0024));
      this.cameras.main.zoomTo(1.012, 70, Phaser.Math.Easing.Quadratic.Out, false, (_camera, progress) => {
        if (progress === 1) this.cameras.main.zoomTo(1, 130, Phaser.Math.Easing.Back.Out);
      });
    }
    sound(this, "land");
    for (let i = 0; i < this.performance.landingDebris; i += 1) {
      const startX = this.granny.x + Phaser.Math.Between(-25, 25);
      const startY = this.granny.y + 46;
      this.emitEffectCircle(
        startX,
        startY,
        Phaser.Math.Between(2, 5),
        0xe7d5aa,
        0.7,
        17,
        {
        x: startX + Phaser.Math.Between(-55, 55),
        y: startY - Phaser.Math.Between(18, 55),
        alpha: 0,
        duration: Phaser.Math.Between(280, 480),
        ease: "Quad.out"
        }
      );
    }
  }

  createReactiveProps() {
    this.reactiveProps = [];
    for (let x = 520, index = 0; x < this.level.length - 300; x += this.performance.ambientPropsStep, index += 1) {
      const color = this.level.world === 2 ? (index % 2 ? 0xf05d6b : 0xffcc4d) : this.level.world === 3 ? 0xe85d65 : 0x6fa457;
      const stem = this.add.rectangle(0, 9, 5, 30, 0x4e8b50);
      const bloom = this.add.circle(0, -9, this.level.world === 2 ? 9 : 12, color);
      const prop = this.add.container(x, 555, [stem, bloom]).setDepth(7);
      prop.setData("triggered", false);
      this.reactiveProps.push(prop);
    }
  }

  createBossEncounter() {
    this.bossEncounter = new BossEncounter(this);
    this.bossEncounter.create();
  }

  bossTitle() {
    return this.bossEncounter?.title() || new BossEncounter(this).title();
  }

  spawnBossWeakPoint() {
    this.bossEncounter?.spawnWeakPoint();
  }

  hitBoss(granny, weak) {
    this.bossEncounter?.hitBoss(granny, weak);
  }

  updateBossEncounter() {
    this.bossEncounter?.update();
  }

  hitByBoss(granny, projectile) {
    this.bossEncounter?.hitByBoss(granny, projectile);
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
      this.emitEffectCircle(prop.x, prop.y - 18, 5, 0x73a75d, 0.8, 18, {
        x: prop.x + 55,
        y: prop.y - 63,
        angle: 180,
        alpha: 0,
        duration: 600
      });
    });
  }

  createEffectPool() {
    this.effectPool = Array.from({ length: this.performance.mode === "balanced" ? 18 : 32 }, () => (
      this.add.circle(-100, -100, 4, 0xffffff, 0)
        .setVisible(false)
        .setActive(false)
    ));
  }

  emitEffectCircle(x, y, radius, color, alpha, depth, tween) {
    const effect = this.effectPool?.find((entry) => !entry.active);
    if (!effect) return { x, y };
    this.tweens.killTweensOf(effect);
    effect.setPosition(x, y)
      .setRadius(radius)
      .setFillStyle(color, alpha)
      .setScale(1)
      .setAngle(0)
      .setDepth(depth)
      .setVisible(true)
      .setActive(true);
    this.tweens.add({
      targets: effect,
      ...tween,
      onComplete: () => effect.setVisible(false).setActive(false)
    });
    return effect;
  }

  createSpeedLines() {
    this.speedLines = Array.from({ length: this.performance.mode === "balanced" ? 5 : 9 }, (_, index) => (
      this.add.rectangle(150 + index * 137, 190 + (index % 4) * 95, 115 + (index % 3) * 45, 4, 0xfff4d2, 0)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(46)
        .setAngle(-4)
    ));
  }

  updateSpeedLines() {
    const boosting = this.time.now < this.granny.hookBoostUntil && this.running;
    this.speedLines?.forEach((line, index) => {
      line.setAlpha(boosting ? 0.2 + (index % 3) * 0.12 : 0);
      if (!boosting) return;
      line.x -= 18 + index % 4;
      if (line.x < -120) line.x = 1400 + index * 20;
    });
  }

  updateOffscreenPhysics() {
    if (this.time.now - this.lastPhysicsCullAt < this.performance.offscreenPhysicsInterval) return;
    this.lastPhysicsCullAt = this.time.now;
    const left = this.cameras.main.scrollX - 260;
    const right = this.cameras.main.scrollX + 1540;
    [this.coins, this.treats].forEach((group) => {
      group.getChildren().forEach((item) => {
        if (item.active && item.body) item.body.enable = item.x >= left && item.x <= right;
      });
    });
  }

  reactThief(copy) {
    if (!this.thiefReaction || !this.thief?.visible) return;
    this.thiefReaction.setText(copy).setVisible(true).setAlpha(1).setScale(0.65);
    this.tweens.killTweensOf(this.thiefReaction);
    this.tweens.add({
      targets: this.thiefReaction,
      y: this.thiefReaction.y - 24,
      scale: 1,
      alpha: 0,
      duration: 620,
      ease: "Back.out",
      onComplete: () => this.thiefReaction.setVisible(false)
    });
    this.tweens.add({ targets: this.thief, scaleY: this.thief.scaleY * 1.08, duration: 80, yoyo: true });
  }

  fall() {
    if (this.finished) return;
    this.falls += 1;
    if (this.falls >= this.maxFalls) {
      this.lose("falls");
      return;
    }
    let checkpoint = Math.max(140, Math.floor(this.granny.x / 620) * 620 + 120);
    const nearbyGap = this.courseGaps.find(([start, end]) => this.granny.x > start - 170 && this.granny.x < end + 70);
    if (nearbyGap) checkpoint = Math.max(140, nearbyGap[0] - 145);
    let safeRespawn = Math.max(this.respawnX, checkpoint);
    const respawnGap = this.courseGaps.find(([start, end]) => safeRespawn > start - 70 && safeRespawn < end + 60);
    if (respawnGap) safeRespawn = Math.max(140, respawnGap[0] - 145);
    this.respawnX = safeRespawn;
    if (Math.abs(this.respawnX - this.lastFallCheckpoint) < 100) this.repeatFallCount += 1;
    else this.repeatFallCount = 0;
    this.lastFallCheckpoint = this.respawnX;
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(180, 236, 89, 102);
    this.releaseCane();
    this.granny.body.enable = false;
    this.running = false;
    const recovery = this.save.equippedGear === "helmetBoost" ? 180 : 430;
    const racePenalty = recovery / 1000 + 0.55 + this.level.world * 0.08;
    this.elapsed += racePenalty;
    this.thiefProgress += this.thiefSpeed * racePenalty;
    this.time.delayedCall(recovery, () => {
      const mercyBoost = Math.min(this.repeatFallCount * 45, 90);
      this.granny.setPosition(Math.max(140, this.respawnX + mercyBoost), 450);
      this.granny.setAngle(0);
      this.granny.body.enable = true;
      this.granny.body.allowGravity = true;
      this.granny.setVelocity(250, 0);
      this.running = true;
    });
  }

  lose(reason = "thief") {
    if (this.finished) return;
    this.finished = true;
    this.lost = true;
    this.running = false;
    this.granny.frozen = true;
    this.granny.setVelocity(0, 0);
    this.physics.pause();
    this.cameras.main.shake(260, 0.012);
    sound(this, "crash");

    const copy = {
      thief: ["THE THIEF ESCAPED!", "Too slow — use hooks and keep your momentum."],
      time: ["TIME RAN OUT!", "The thief reached the getaway route first."],
      falls: ["GRANNY WIPED OUT!", `Only ${this.maxFalls - 1} falls allowed in this world.`]
    }[reason] || ["CAT-NAPPED!", "Try the chase again."];
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x241827, 0.78).setScrollFactor(0).setDepth(120).setInteractive();
    const panel = this.add.rectangle(640, 350, 620, 390, COLORS.cream).setScrollFactor(0).setDepth(121);
    panel.setStrokeStyle(8, COLORS.ink);
    const title = this.add.text(640, 235, copy[0], textStyle(40, "#ec5966")).setOrigin(0.5).setScrollFactor(0).setDepth(122);
    const message = this.add.text(640, 295, copy[1], textStyle(20, "#6f596d")).setOrigin(0.5).setScrollFactor(0).setDepth(122);
    const gap = Math.max(0, Math.round(this.thiefProgress - this.granny.x));
    const stats = this.add.text(640, 345, `THIEF LEAD  ${gap}m   ·   FALLS  ${this.falls}/${this.maxFalls}`, textStyle(17))
      .setOrigin(0.5).setScrollFactor(0).setDepth(122);
    const retry = pill(this, 520, 440, 210, 62, "↻  RETRY", { fill: COLORS.yellow, size: 21 }).setScrollFactor(0).setDepth(123);
    const map = pill(this, 760, 440, 210, 62, "BACK TO MAP", { fill: COLORS.cream, size: 19 }).setScrollFactor(0).setDepth(123);
    retry.on("pointerup", () => {
      this.physics.resume();
      this.scene.start("LevelIntroScene", { levelId: this.level.id });
    });
    map.on("pointerup", () => {
      this.physics.resume();
      this.scene.start("LevelSelect", { worldId: this.level.world });
    });
    this.lossPanel = [shade, panel, title, message, stats, retry, map];
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
    const { firstClear, reward } = SaveGame.completeLevel(this.level, result);
    this.registry.set("save", SaveGame.load());
    this.time.delayedCall(350, () => {
      this.scene.start("LevelCompleteMapScene", {
        levelId: this.level.id,
        result,
        firstClear,
        reward
      });
    });
  }

  resultPanel(result, firstClear, reward = { type: "none" }) {
    this.resultsPanel.show(result, firstClear, reward);
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
