import { LEVELS, WORLDS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { addPaperTexture, COLORS, coinBadge, pill, textStyle, topBar } from "../ui/ui.js";

export class LevelSelect extends Phaser.Scene {
  constructor() {
    super("LevelSelect");
  }

  init(data) {
    this.requestedWorld = data?.worldId;
  }

  create() {
    const save = SaveGame.load();
    this.registry.set("save", save);
    const latestWorld = Phaser.Math.Clamp(Math.ceil(save.unlockedLevel / 9), 1, 5);
    this.worldId = Phaser.Math.Clamp(this.requestedWorld || latestWorld, 1, 5);
    this.world = WORLDS[this.worldId - 1];
    this.cameras.main.setBackgroundColor(this.world.sky);
    this.drawMap();
    addPaperTexture(this);
    topBar(this, "THE GREAT CAT CHASE", () => this.scene.start("MainMenu"));
    const badge = coinBadge(this);
    badge.setValue(save.coins);

    this.add.text(55, 122, `${this.world.label} · ${this.world.locale.toUpperCase()}`, textStyle(17, "#5e4b61")).setOrigin(0);
    this.add.text(55, 150, this.world.name, textStyle(30, "#2f2335")).setOrigin(0);
    this.makeWorldTabs(save);
    this.levelCards(save);
  }

  drawMap() {
    const palette = [
      [0xcdebd7, 0xa9d2b4],
      [0xbfe8ef, 0x79b9a0],
      [0xc7bada, 0x8c6f91],
      [0xc1e0e9, 0xd69a68],
      [0x574c7b, 0x3e365f]
    ][this.worldId - 1];
    const g = this.add.graphics();
    g.fillStyle(palette[0]).fillRect(0, 0, 1280, 720);
    g.fillStyle(palette[1]).fillEllipse(140, 610, 450, 250).fillEllipse(1150, 620, 470, 270);
    g.lineStyle(25, 0xfff4cf, 1).beginPath()
      .moveTo(60, 565).lineTo(150, 520).lineTo(250, 465).lineTo(326, 337).lineTo(505, 313)
      .lineTo(650, 390).lineTo(770, 520).lineTo(915, 530).lineTo(1030, 410).lineTo(1162, 255).lineTo(1240, 230)
      .strokePath();
    g.lineStyle(4, 0xbda96e, 0.48).strokePath();

    for (let i = 0; i < 18; i += 1) {
      const x = 30 + i * 78;
      const y = 205 + (i % 3) * 17;
      if (this.worldId === 2 && i % 4 === 0) {
        g.fillStyle(0xf7f3df).fillRect(x - 5, y - 40, 10, 70);
        g.fillStyle(0x557c6c).fillTriangle(x, y - 35, x - 35, y - 5, x + 35, y - 5);
      } else if (this.worldId === 3) {
        g.fillStyle(0xe65f64).fillCircle(x, y, 16);
        g.fillStyle(0xffdc63).fillCircle(x, y, 7);
      } else if (this.worldId === 4) {
        g.fillStyle(i % 2 ? 0xc76e49 : 0x4f89a8).fillRect(x - 18, y - 25, 36, 55);
      } else if (this.worldId === 5) {
        g.fillStyle(i % 2 ? 0xff6e9f : 0x78d5d7).fillCircle(x, y, 22);
        g.fillStyle(0xffe27a).fillCircle(x, y, 7);
      } else {
        g.fillStyle(i % 2 ? 0x6ba363 : 0x568b57).fillCircle(x, y, 26 + (i % 4) * 3);
        g.fillStyle(0x6e4f36).fillRect(x - 5, y + 18, 10, 30);
      }
    }
  }

  makeWorldTabs(save) {
    WORLDS.forEach((world, index) => {
      const firstLevel = index * 9 + 1;
      const unlocked = save.unlockedLevel >= firstLevel;
      const current = world.id === this.worldId;
      const button = pill(this, 465 + index * 145, 137, 128, 48, unlocked ? String(world.id).padStart(2, "0") : "🔒", {
        fill: current ? world.accent : unlocked ? COLORS.cream : 0xa69ca5,
        size: 17
      });
      if (unlocked) button.on("pointerup", () => this.scene.restart({ worldId: world.id }));
    });
  }

  levelCards(save) {
    const positions = [
      [105, 545], [250, 475], [326, 347],
      [505, 323], [650, 400], [770, 530],
      [915, 540], [1030, 420], [1162, 265]
    ];
    const levels = LEVELS.filter((level) => level.world === this.worldId);
    levels.forEach((level, index) => {
      const [x, y] = positions[index];
      const unlocked = level.id <= save.unlockedLevel;
      const record = save.levels[level.id];
      const color = level.boss ? 0xec5966 : this.world.accent;
      const shadow = this.add.circle(x, y + 6, level.boss ? 47 : 42, 0x2f2335, 0.24);
      const node = this.add.circle(x, y, level.boss ? 47 : 42, unlocked ? color : 0x8c8a87, 1);
      node.setStrokeStyle(level.boss ? 7 : 5, COLORS.cream);
      const label = this.add.text(x, y - 2, unlocked ? (level.boss ? "★" : String(index + 1)) : "🔒", textStyle(unlocked ? 29 : 20, "#fff7df")).setOrigin(0.5);
      const hit = this.add.circle(x, y, 54, 0xffffff, 0.001).setInteractive({ useHandCursor: unlocked });
      if (unlocked) {
        hit.on("pointerover", () => this.showCard(level, x, y));
        hit.on("pointerout", () => this.hideCard());
        hit.on("pointerup", () => this.scene.start("GameScene", { levelId: level.id }));
      }
      if (record) this.add.text(x, y + 54, "🐾".repeat(record.paws), textStyle(15, "#553b56")).setOrigin(0.5);
      if (level.id === save.unlockedLevel) {
        this.tweens.add({ targets: [shadow, node, label, hit], scale: 1.12, duration: 650, yoyo: true, repeat: -1 });
      }
    });

    const worldStart = (this.worldId - 1) * 9 + 1;
    const playable = Phaser.Math.Clamp(save.unlockedLevel, worldStart, worldStart + 8);
    const quick = pill(this, 1085, 655, 300, 58, `PLAY · LEVEL ${playable}`, { fill: COLORS.yellow, size: 20 });
    quick.on("pointerup", () => this.scene.start("GameScene", { levelId: playable }));
  }

  showCard(level, x, y) {
    this.hideCard();
    const px = Phaser.Math.Clamp(x, 200, 1080);
    const py = y > 400 ? y - 130 : y + 135;
    const panel = this.add.rectangle(px, py, 350, 104, COLORS.ink, 0.95).setDepth(20);
    panel.setStrokeStyle(4, COLORS.cream);
    const title = this.add.text(px, py - 25, `${level.id}. ${level.title}`, textStyle(21, "#fff7df")).setOrigin(0.5).setDepth(21);
    const sub = this.add.text(px, py + 5, level.boss ? "BOSS RUN · WORLD TROPHY" : `${level.cat.name} needs you!`, textStyle(15, "#ffcd54")).setOrigin(0.5).setDepth(21);
    const length = this.add.text(px, py + 31, `${Math.round(level.length / 100) * 10}m chase`, textStyle(12, "#cabdcb")).setOrigin(0.5).setDepth(21);
    this.hoverCard = [panel, title, sub, length];
  }

  hideCard() {
    this.hoverCard?.forEach((item) => item.destroy());
    this.hoverCard = null;
  }
}
