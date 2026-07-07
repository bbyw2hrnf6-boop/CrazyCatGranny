import { getTotalLevelCount, getLevelsForWorld } from "../content/GameContentStats.js";
import { nextReleasedLevelId } from "../config/ReleaseConfig.js";
import { LEVELS, levelById, WORLDS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { catFrameForLevel, createCat } from "../visual/VisualFactory.js";
import { COLORS, coinBadge, pill, sound, textStyle } from "../ui/ui.js";

const MAP_POSITIONS = [
  [105, 545], [250, 475], [326, 347],
  [505, 323], [650, 400], [770, 530],
  [915, 540], [1030, 420], [1162, 265]
];

export class LevelCompleteMapScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteMapScene");
  }

  init(data) {
    this.level = levelById(data?.levelId || 1);
    this.result = data?.result || { coins: 0, treats: 0, time: 0, falls: 0, paws: 1 };
    this.firstClear = Boolean(data?.firstClear);
    this.reward = data?.reward || { type: "none" };
    this.world = WORLDS[this.level.world - 1];
  }

  create() {
    this.save = SaveGame.load();
    this.cameras.main.setBackgroundColor(this.world.sky);
    this.drawMap();
    coinBadge(this).setValue(this.save.coins);
    this.animateProgress();
  }

  drawMap() {
    this.add.image(640, 360, `world-bg-${this.level.world}`).setDisplaySize(1280, 720).setAlpha(0.68).setDepth(-20);
    this.add.rectangle(640, 360, 1280, 720, this.world.sky, 0.18).setDepth(-19);
    const g = this.add.graphics().setDepth(-10);
    g.lineStyle(26, 0xfff4cf, 1).beginPath()
      .moveTo(60, 565).lineTo(150, 520).lineTo(250, 465).lineTo(326, 337).lineTo(505, 313)
      .lineTo(650, 390).lineTo(770, 520).lineTo(915, 530).lineTo(1030, 410).lineTo(1162, 255).lineTo(1240, 230)
      .strokePath();
    g.lineStyle(4, 0xbda96e, 0.52).strokePath();

    getLevelsForWorld(this.level.world).forEach((level, index) => {
      const [x, y] = MAP_POSITIONS[index];
      const completed = this.save.levels[level.id]?.completed;
      const active = level.id === this.level.id;
      const node = this.add.circle(x, y, active ? 46 : 35, completed ? 0x3f9f7c : active ? COLORS.coral : COLORS.cream, 1).setDepth(1);
      node.setStrokeStyle(active ? 7 : 5, active ? COLORS.yellow : COLORS.ink);
      this.add.text(x, y - 2, completed ? "✓" : level.boss ? "★" : String(index + 1), textStyle(active ? 30 : 22, "#fff7df"))
        .setOrigin(0.5)
        .setDepth(2);
    });
  }

  animateProgress() {
    const index = Math.max(0, (this.level.id - 1) % MAP_POSITIONS.length);
    const [x, y] = MAP_POSITIONS[index];
    const nextLevelId = nextReleasedLevelId(this.level, LEVELS);
    const nextLevel = nextLevelId ? levelById(nextLevelId) : null;
    const nextIndex = nextLevel && nextLevel.world === this.level.world ? (nextLevel.id - 1) % MAP_POSITIONS.length : null;
    const title = this.add.text(640, 74, this.level.id === getTotalLevelCount() ? "GRAND CHASE COMPLETE!" : "LEVEL COMPLETE!", textStyle(34, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(20)
      .setBackgroundColor("#2f2335dd")
      .setPadding(22, 8);
    const tick = this.add.text(x, y - 4, "✓", textStyle(70, "#fff7df")).setOrigin(0.5).setDepth(22).setScale(0.1);
    const marker = this.add.circle(x, y, 18, COLORS.yellow, 1).setStrokeStyle(4, COLORS.ink).setDepth(21).setAlpha(0);

    sound(this, "win");
    this.tweens.add({
      targets: tick,
      scale: 1,
      angle: 360,
      duration: 560,
      ease: "Back.out",
      onComplete: () => {
        if (nextIndex === null) {
          this.time.delayedCall(350, () => this.showSummary(title));
          return;
        }
        const [nx, ny] = MAP_POSITIONS[nextIndex];
        marker.setAlpha(1);
        title.setText(`NEXT: LEVEL ${nextLevel.id}`);
        this.tweens.add({
          targets: marker,
          x: nx,
          y: ny,
          duration: 900,
          ease: "Sine.inOut",
          onComplete: () => this.showSummary(title, nextLevel.id)
        });
      }
    });
  }

  showSummary(title, nextLevelId = null) {
    title.setText(this.rewardTitle());
    this.playRewardMoment();
    const panel = this.add.rectangle(640, 560, 760, 210, COLORS.cream, 0.96).setDepth(30);
    panel.setStrokeStyle(7, COLORS.ink);
    this.add.text(640, 500, this.rewardCopy(), textStyle(20, "#5f4b5d", { wordWrap: { width: 680 }, align: "center" }))
      .setOrigin(0.5)
      .setDepth(31);
    this.add.text(
      640,
      543,
      `PAWS ${"🐾".repeat(this.result.paws)}${"·".repeat(3 - this.result.paws)}   ·   COINS ${this.result.coins}   ·   TIME ${Number(this.result.time).toFixed(1)}s`,
      textStyle(18, "#2f2335")
    ).setOrigin(0.5).setDepth(31);

    const retry = pill(this, 410, 625, 200, 58, "↻ RETRY", { fill: COLORS.cream, size: 19 }).setDepth(32);
    const next = pill(this, 640, 625, 220, 58, nextLevelId ? "NEXT →" : "WORLD MAP", { fill: COLORS.yellow, size: 19 }).setDepth(32);
    const home = pill(this, 875, 625, 220, 58, "CAT HOUSE", { fill: COLORS.teal, color: "#fff7df", size: 19 }).setDepth(32);
    retry.on("pointerup", () => this.scene.start("LevelIntroScene", { levelId: this.level.id }));
    next.on("pointerup", () => nextLevelId
      ? this.scene.start("LevelIntroScene", { levelId: nextLevelId })
      : this.scene.start("LevelSelect", { worldId: this.level.world }));
    home.on("pointerup", () => this.scene.start("CatHouse", { page: this.level.world }));
  }

  playRewardMoment() {
    if (this.reward.type === "rescue") {
      this.playRescueMoment();
      return;
    }
    if (this.reward.type === "catbox-pending") {
      this.playCatBoxStoredMoment();
      return;
    }
    if (this.level.boss) {
      this.playBossTrophyMoment();
    }
  }

  playRescueMoment() {
    const rewardLevel = this.reward.catId
      ? LEVELS.find((level) => level.cat.id === this.reward.catId)
      : this.level;
    const frame = rewardLevel ? catFrameForLevel(rewardLevel.id) : catFrameForLevel(this.level.id);
    const catName = rewardLevel ? SaveGame.catName(rewardLevel.cat.id, rewardLevel.cat.name) : "Cat";
    const rarity = rewardLevel ? rewardLevel.cat.rarity.toUpperCase() : "RESCUED";
    const popup = this.add.rectangle(640, 304, 570, 242, COLORS.cream, 0.96).setDepth(23).setScale(0.25);
    popup.setStrokeStyle(7, COLORS.ink);
    const glow = this.add.circle(640, 306, 104, 0xffcc4d, 0.24).setDepth(24).setScale(0.1);
    const rays = this.add.graphics().setDepth(24);
    rays.lineStyle(5, 0xfff7df, 0.62);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      rays.beginPath()
        .moveTo(640 + Math.cos(angle) * 74, 306 + Math.sin(angle) * 74)
        .lineTo(640 + Math.cos(angle) * 138, 306 + Math.sin(angle) * 138)
        .strokePath();
    }
    rays.setAlpha(0);

    const granny = this.add.sprite(470, 352, "granny-skate", 0).setScale(0.2).setDepth(25).play("granny-skating");
    const cat = createCat(this, 825, 330, frame, 0.22).setDepth(27).setAlpha(0);
    const heart = this.add.text(640, 302, "♥", textStyle(64, "#ec5966")).setOrigin(0.5).setDepth(28).setScale(0.1);
    const nameplate = this.add.text(640, 410, `${catName.toUpperCase()} IS HOME!`, textStyle(27, "#2f2335", { align: "center" }))
      .setOrigin(0.5)
      .setDepth(28)
      .setAlpha(0);
    const rarityText = this.add.text(640, 444, rarity, textStyle(16, rewardLevel?.cat.limited ? "#a45ad0" : "#725f72"))
      .setOrigin(0.5)
      .setDepth(28)
      .setAlpha(0);
    const bubble = this.add.text(816, 248, "MEOW!", textStyle(20, "#ec5966"))
      .setOrigin(0.5)
      .setDepth(29)
      .setBackgroundColor("#fff7dfdd")
      .setPadding(10, 4)
      .setAlpha(0);
    this.tweens.add({ targets: popup, scale: 1, duration: 360, ease: "Back.out" });
    this.tweens.add({ targets: glow, scale: 1, duration: 420, ease: "Back.out" });
    this.tweens.add({ targets: rays, alpha: 1, angle: 24, duration: 420, ease: "Sine.out" });
    this.tweens.add({ targets: cat, alpha: 1, x: 666, y: 328, angle: 7, duration: 740, delay: 140, ease: "Back.out" });
    this.tweens.add({ targets: granny, x: 570, duration: 680, delay: 80, ease: "Sine.out" });
    this.tweens.add({ targets: bubble, alpha: 1, y: 236, duration: 240, delay: 260, yoyo: true, repeat: 2, ease: "Sine.inOut" });
    this.tweens.add({
      targets: heart,
      scale: 1,
      y: 286,
      duration: 440,
      delay: 420,
      ease: "Back.out",
      onComplete: () => sound(this, "rescue")
    });
    this.tweens.add({ targets: [nameplate, rarityText], alpha: 1, y: "-=8", duration: 320, delay: 620, ease: "Sine.out" });
    this.tweens.add({ targets: cat, y: 318, duration: 520, delay: 860, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.tweens.add({ targets: glow, alpha: 0.38, scale: 1.08, duration: 700, delay: 780, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  playCatBoxStoredMoment() {
    const box = this.drawRewardBox(640, 245, 25, 1, this.reward.world % 2 ? 0x9467bd : 0x41b9ad);
    const label = this.add.text(640, 345, "Stored safely in the Cat House", textStyle(19, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(26)
      .setBackgroundColor("#2f2335cc")
      .setPadding(14, 5);
    const arrow = this.add.text(640, 294, "↓", textStyle(42, "#ffcc4d")).setOrigin(0.5).setDepth(27).setAlpha(0);
    sound(this, "box");
    this.tweens.add({ targets: box, y: 292, scale: 1.1, angle: -5, duration: 430, ease: "Bounce.out" });
    this.tweens.add({ targets: arrow, alpha: 1, y: 318, duration: 360, delay: 260, yoyo: true, repeat: 1 });
    this.tweens.add({ targets: label, scale: 1.04, duration: 480, yoyo: true, repeat: 1, ease: "Sine.inOut" });
  }

  playBossTrophyMoment() {
    const trophy = this.add.text(640, 305, "★", textStyle(92, "#ffcc4d")).setOrigin(0.5).setDepth(26).setScale(0.15);
    const rays = this.add.graphics().setDepth(25);
    rays.lineStyle(5, 0xfff7df, 0.76);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      rays.beginPath()
        .moveTo(640 + Math.cos(angle) * 36, 305 + Math.sin(angle) * 36)
        .lineTo(640 + Math.cos(angle) * 92, 305 + Math.sin(angle) * 92)
        .strokePath();
    }
    sound(this, "boss");
    this.tweens.add({ targets: trophy, scale: 1, angle: 360, duration: 620, ease: "Back.out" });
    this.tweens.add({ targets: rays, alpha: 0, scale: 1.35, duration: 900, delay: 260, onComplete: () => rays.destroy() });
  }

  drawRewardBox(x, y, depth = 25, scale = 1, color = 0x9467bd) {
    const g = this.add.graphics();
    g.fillStyle(0x241a2a, 0.22).fillEllipse(0, 54, 160, 24);
    g.fillStyle(color).fillRoundedRect(-70, -34, 140, 86, 13);
    g.lineStyle(6, COLORS.ink).strokeRoundedRect(-70, -34, 140, 86, 13);
    g.fillStyle(0xffe0a1).fillTriangle(-60, -33, -44, -72, -20, -33)
      .fillTriangle(20, -33, 44, -72, 60, -33);
    g.fillStyle(0xfff1c5).fillRoundedRect(-78, -48, 156, 28, 10);
    g.lineStyle(5, COLORS.ink).strokeRoundedRect(-78, -48, 156, 28, 10);
    g.fillStyle(0x3b2a40).fillCircle(0, 7, 15)
      .fillCircle(-19, -7, 8).fillCircle(0, -12, 8).fillCircle(19, -7, 8);
    return this.add.container(x, y, [g]).setScale(scale).setDepth(depth);
  }

  rewardTitle() {
    if (this.reward.type === "catbox-pending") return "CATBOX STORED!";
    if (this.reward.type === "rescue") return "CAT RESCUED!";
    if (this.level.boss) return "WORLD SAVED!";
    return "MAP UPDATED!";
  }

  rewardCopy() {
    if (this.reward.type === "catbox-pending") return "Mystery CatBox stored in the Cat House. Open it whenever you like!";
    if (this.reward.type === "catbox-coins") return `Cat collection full · CatBox converted to ${this.reward.coins} coins!`;
    if (this.reward.type === "rescue") return "Two chases complete. The rescued cat is safe in the Cat House.";
    if (this.level.boss) return `${this.world.name} trophy earned.`;
    return this.firstClear ? "This level is ticked off. The chase moves to the next stop." : "Replay complete. Try for more paws, treats and coins.";
  }
}
