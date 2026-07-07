import { getTotalLevelCount, getLevelsForWorld } from "../content/GameContentStats.js";
import { nextReleasedLevelId } from "../config/ReleaseConfig.js";
import { LEVELS, levelById, WORLDS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
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

  rewardTitle() {
    if (this.reward.type === "catbox-pending") return "CATBOX STORED!";
    if (this.reward.type === "rescue") return "CAT RESCUED!";
    if (this.level.boss) return "WORLD SAVED!";
    return "MAP UPDATED!";
  }

  rewardCopy() {
    if (this.reward.type === "catbox-pending") return "Mystery CatBox stored in the Cat House. Open it whenever you like!";
    if (this.reward.type === "catbox-coins") return `Cat collection full · CatBox converted to ${this.reward.coins} coins!`;
    if (this.reward.type === "rescue") return "The rescued cat is safe in the Cat House.";
    if (this.level.boss) return `${this.world.name} trophy earned.`;
    return this.firstClear ? "This level is ticked off. The chase moves to the next stop." : "Replay complete. Try for more paws, treats and coins.";
  }
}
