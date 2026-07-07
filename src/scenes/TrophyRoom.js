import { SaveGame } from "../savegame/SaveGame.js";
import { getTotalCatCount } from "../content/GameContentStats.js";
import { addPaperTexture, COLORS, coinBadge, pill, textStyle, topBar } from "../ui/ui.js";

const TROPHIES = [
  { id: "first", name: "First Rescue", text: "Bring one cat home", check: (s) => s.rescuedCats.length >= 1 },
  { id: "suburb", name: "Home Hero", text: "Defeat the Hedge Crusher", check: (s) => s.worldTrophies.includes(1) },
  { id: "dutch", name: "Lowlands Legend", text: "Defeat Stormmill Max", check: (s) => s.worldTrophies.includes(2) },
  { id: "asia", name: "Lantern Legend", text: "Defeat the Neon Dragon", check: (s) => s.worldTrophies.includes(3) },
  { id: "usa", name: "Coast Hero", text: "Defeat the Rocket Bandit", check: (s) => s.worldTrophies.includes(4) },
  { id: "carnival", name: "Moon Maestro", text: "Defeat Maestro Mech", check: (s) => s.worldTrophies.includes(5) },
  { id: "all", name: "Full House", text: `Rescue all ${getTotalCatCount()} cats`, check: (s) => s.rescuedCats.length >= getTotalCatCount() },
  { id: "rich", name: "Coin Purse", text: "Collect 500 coins total", check: (s) => s.totalCoins >= 500 },
  { id: "treats", name: "Snack Attack", text: "Get all treats in a level", check: (s) => Object.values(s.levels).some((l) => l.treats === 3) },
  { id: "clean", name: "Still Got It", text: "Finish without falling", check: (s) => Object.values(s.levels).some((l) => l.noFalls) },
  { id: "perfect", name: "Perfect Paws", text: "Earn a 3-paw rating", check: (s) => Object.values(s.levels).some((l) => l.paws === 3) },
  { id: "fashion", name: "Feline Fashion", text: "Dress one rescued cat", check: (s) => Object.keys(s.hatAssignments).length > 0 }
];

export class TrophyRoom extends Phaser.Scene {
  constructor() {
    super("TrophyRoom");
  }

  create() {
    const save = SaveGame.load();
    this.drawRoom();
    addPaperTexture(this);
    topBar(this, "GRANNY'S TROPHY CABINET", () => this.scene.start("MainMenu"));
    const badge = coinBadge(this);
    badge.setValue(save.coins);
    const unlocked = TROPHIES.filter((trophy) => trophy.check(save)).length;
    this.add.text(65, 126, `${unlocked}/${TROPHIES.length} TROPHIES ON THE SHELVES`, textStyle(17, "#f0d8b0")).setOrigin(0);

    TROPHIES.forEach((trophy, index) => {
      const done = trophy.check(save);
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 190 + col * 300;
      const y = 230 + row * 185;
      this.createTrophy(x, y, index, done);
      const plaque = this.add.rectangle(x, y + 65, 205, 43, done ? 0x3b2828 : 0x2c2630).setStrokeStyle(3, done ? 0xd7a74f : 0x5e5262);
      this.add.text(x, y + 58, done ? trophy.name : "UNDISCOVERED", textStyle(14, done ? "#ffe8ad" : "#827685")).setOrigin(0.5);
      this.add.text(x, y + 75, done ? trophy.text : "Keep chasing…", textStyle(9, done ? "#d9c8b0" : "#756a79")).setOrigin(0.5);
      const hit = this.add.rectangle(x, y, 230, 150, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => this.showDetail(trophy, done));
    });

    const play = pill(this, 1095, 128, 280, 48, "EARN MORE  →", { fill: COLORS.yellow, size: 17 });
    play.on("pointerup", () => this.scene.start("LevelSelect"));
  }

  drawRoom() {
    const g = this.add.graphics();
    g.fillStyle(0x2a202d).fillRect(0, 0, 1280, 720);
    g.fillStyle(0x5a382d).fillRoundedRect(28, 105, 1224, 600, 18);
    g.fillStyle(0x2d2730).fillRoundedRect(48, 150, 1184, 535, 12);
    for (let panel = 0; panel < 4; panel += 1) {
      g.fillStyle(panel % 2 ? 0x332a34 : 0x2b2530).fillRect(60 + panel * 292, 165, 275, 510);
      g.lineStyle(3, 0x78503b, 0.55).strokeRect(60 + panel * 292, 165, 275, 510);
    }
    [320, 505, 690].forEach((y) => {
      g.fillStyle(0x291b1c, 0.65).fillRect(45, y + 10, 1190, 16);
      g.fillStyle(0x9b6543).fillRoundedRect(38, y, 1204, 18, 6);
      g.fillStyle(0xd19a61, 0.8).fillRect(48, y + 2, 1184, 4);
    });
    for (let x = 190; x < 1200; x += 300) {
      g.fillStyle(0xffdc74, 0.08).fillTriangle(x, 140, x - 110, 320, x + 110, 320);
    }
  }

  createTrophy(x, y, index, done) {
    const gold = done ? 0xf1bd43 : 0x4b424d;
    const dark = done ? 0x9d622e : 0x38323b;
    const shine = done ? 0xffe99c : 0x605664;
    const glow = this.add.circle(x, y - 12, 65, done ? 0xffdc68 : 0x000000, done ? 0.11 : 0.12);
    const g = this.add.graphics();
    g.fillStyle(dark).fillRoundedRect(x - 45, y + 33, 90, 18, 5);
    g.fillStyle(gold).fillRoundedRect(x - 32, y + 20, 64, 17, 5);
    g.fillStyle(gold).fillRect(x - 8, y - 8, 16, 32);
    g.fillStyle(gold).fillEllipse(x, y - 22, 68, 52);
    g.lineStyle(8, gold).beginPath().arc(x - 34, y - 20, 23, Math.PI * 0.55, Math.PI * 1.45)
      .moveTo(x + 34, y - 43).arc(x + 34, y - 20, 23, Math.PI * 1.55, Math.PI * 0.45).strokePath();
    g.fillStyle(shine, 0.8).fillEllipse(x - 14, y - 30, 11, 25);
    g.lineStyle(4, dark).strokeEllipse(x, y - 22, 68, 52);

    if (index === 0 || index === 6 || index === 10) {
      g.fillStyle(done ? 0xfff2c4 : shine).fillCircle(x, y - 25, 12)
        .fillCircle(x - 16, y - 40, 7).fillCircle(x, y - 45, 7).fillCircle(x + 16, y - 40, 7);
    } else if (index === 2) {
      g.lineStyle(5, done ? 0xfff2c4 : shine).beginPath().moveTo(x, y - 65).lineTo(x, y - 8)
        .moveTo(x - 29, y - 36).lineTo(x + 29, y - 36).moveTo(x - 22, y - 58).lineTo(x + 22, y - 14)
        .moveTo(x + 22, y - 58).lineTo(x - 22, y - 14).strokePath();
    } else if (index === 3) {
      g.fillStyle(done ? 0xe65d64 : shine).fillRoundedRect(x - 15, y - 61, 30, 42, 9);
      g.fillStyle(done ? 0xffdc62 : dark).fillRect(x - 8, y - 52, 16, 23);
    } else if (index === 4) {
      g.fillStyle(done ? 0x7fc3d4 : shine).fillTriangle(x, y - 70, x - 26, y - 18, x + 26, y - 18);
      g.fillStyle(gold).fillCircle(x, y - 43, 11);
    } else if (index === 5) {
      g.fillStyle(dark).fillRect(x - 29, y - 64, 58, 18).fillRect(x - 20, y - 91, 40, 35);
      g.fillStyle(done ? 0xffdc62 : shine).fillCircle(x, y - 36, 8);
    } else {
      const points = 5;
      const vertices = [];
      for (let point = 0; point < points * 2; point += 1) {
        const radius = point % 2 ? 12 : 27;
        const angle = -Math.PI / 2 + point * Math.PI / points;
        vertices.push(new Phaser.Math.Vector2(x + Math.cos(angle) * radius, y - 43 + Math.sin(angle) * radius));
      }
      g.fillStyle(done ? 0xffef99 : shine).fillPoints(vertices, true);
    }
    if (done) {
      this.tweens.add({ targets: glow, alpha: 0.26, scale: 1.08, duration: 950 + index * 45, yoyo: true, repeat: -1 });
      const sparkle = this.add.image(x + 40, y - 62, "sparkle").setScale(0.28);
      this.tweens.add({ targets: sparkle, alpha: 0.15, angle: 180, scale: 0.5, duration: 800, yoyo: true, repeat: -1 });
    }
  }

  showDetail(trophy, done) {
    this.detail?.forEach((item) => item.destroy());
    const panel = this.add.rectangle(640, 365, 530, 230, COLORS.cream).setDepth(40).setStrokeStyle(6, COLORS.ink);
    const title = this.add.text(640, 320, done ? trophy.name : "Mystery Trophy", textStyle(30, done ? "#bb7138" : "#7d707d")).setOrigin(0.5).setDepth(41);
    const text = this.add.text(640, 375, done ? trophy.text : "Complete its challenge to place it on the shelf.", textStyle(17, "#5f4c5e")).setOrigin(0.5).setDepth(41);
    const close = pill(this, 640, 435, 160, 48, "CLOSE", { fill: COLORS.yellow, size: 16 }).setDepth(42);
    this.detail = [panel, title, text, close];
    close.on("pointerup", () => {
      this.detail.forEach((item) => item.destroy());
      this.detail = null;
    });
  }
}
