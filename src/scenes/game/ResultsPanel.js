import { getTotalLevelCount } from "../../content/GameContentStats.js";
import { LEVELS } from "../../levels/levels.js";
import { nextReleasedLevelId } from "../../config/ReleaseConfig.js";
import { SaveGame } from "../../savegame/SaveGame.js";
import { catFrameForLevel, createCat } from "../../visual/VisualFactory.js";
import { COLORS, pill, textStyle } from "../../ui/ui.js";

export class ResultsPanel {
  constructor(scene) {
    this.scene = scene;
  }

  show(result, firstClear, reward = { type: "none" }) {
    const scene = this.scene;
    const shade = scene.add.rectangle(640, 360, 1280, 720, 0x2f2335, 0.76).setScrollFactor(0).setDepth(100);
    const panel = scene.add.rectangle(640, 354, 760, 590, COLORS.cream).setScrollFactor(0).setDepth(101);
    panel.setStrokeStyle(8, COLORS.ink);
    const rewardLevel = reward.catId ? LEVELS.find((entry) => entry.cat.id === reward.catId) : null;
    const rewardCatName = rewardLevel ? SaveGame.catName(rewardLevel.cat.id, rewardLevel.cat.name) : null;
    let cat = null;
    if (rewardLevel) {
      cat = createCat(scene, 640, 220, catFrameForLevel(rewardLevel.id), 0.27).setScrollFactor(0).setDepth(102);
      scene.tweens.add({ targets: cat, y: 205, angle: 4, duration: 500, yoyo: true, repeat: -1 });
    } else if (reward.type === "catbox-coins") {
      scene.add.image(640, 220, "coin").setScale(1.35).setScrollFactor(0).setDepth(102);
    } else {
      scene.add.text(640, 220, scene.level.boss ? "🏆" : "✓", textStyle(80, "#41a989"))
        .setOrigin(0.5).setScrollFactor(0).setDepth(102);
    }
    const resultTitle = scene.level.id === getTotalLevelCount()
      ? "GRAND CHASE WON!"
      : reward.type === "catbox-pending"
        ? "CATBOX FOUND!"
        : reward.type === "rescue"
          ? "CAT RESCUED!"
          : scene.level.boss
            ? "WORLD SAVED!"
            : "LEVEL CLEAR!";
    scene.add.text(640, 105, resultTitle, textStyle(43, "#ec5966")).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    const levelsUntilCat = scene.level.boss ? 0 : 3 - scene.chapterStep;
    const rescueCopy = reward.type === "catbox-pending"
      ? "Mystery CatBox stored in the Cat House. Open it whenever you like!"
      : reward.type === "catbox" && rewardLevel
      ? `${reward.limited ? "LIMITED " : ""}${reward.rarity.toUpperCase()} · ${rewardCatName} joined the Cat House!`
      : reward.type === "catbox-coins"
        ? `Cat collection full · CatBox converted to ${reward.coins} coins!`
        : reward.type === "rescue" && rewardLevel
          ? `${rewardCatName} is safe after the three-level chase!`
          : scene.level.boss
            ? `🏆 ${scene.worldData.name} trophy earned.`
            : firstClear
              ? `${levelsUntilCat} more level${levelsUntilCat === 1 ? "" : "s"} until the next cat rescue.`
              : "Level replayed · improve paws, treats and time.";
    const rewardCopy = scene.add.text(640, 287, rescueCopy, textStyle(21, reward.limited ? "#a45ad0" : "#5f4b5d"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(102);
    scene.add.text(640, 337, "🐾".repeat(result.paws) + "·".repeat(3 - result.paws), textStyle(41, "#f2a532"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(102);

    const stats = [
      ["COINS", `${result.coins}`],
      ["TREATS", `${result.treats}/3`],
      ["TIME", `${result.time.toFixed(1)}s`],
      ["FALLS", `${result.falls}`]
    ];
    stats.forEach(([label, value], index) => {
      const x = 390 + index * 165;
      scene.add.text(x, 405, label, textStyle(15, "#847486")).setOrigin(0.5).setScrollFactor(0).setDepth(102);
      scene.add.text(x, 441, value, textStyle(27)).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    });

    const retry = pill(scene, 410, 550, 210, 62, "↻  RETRY", { fill: COLORS.cream, size: 21 });
    const nextLevelId = nextReleasedLevelId(scene.level, LEVELS);
    const nextLabel = nextLevelId ? "NEXT  →" : "WORLD MAP";
    const next = pill(scene, 640, 550, 220, 62, nextLabel, { fill: COLORS.yellow, size: 19 });
    const home = pill(scene, 870, 550, 210, 62, "CAT HOUSE", { fill: COLORS.teal, color: "#fff7df", size: 20 });
    [retry, next, home].forEach((button) => button.setScrollFactor(0).setDepth(103));
    retry.on("pointerup", () => scene.scene.start("LevelIntroScene", { levelId: scene.level.id }));
    next.on("pointerup", () => nextLevelId
      ? scene.scene.start("LevelIntroScene", { levelId: nextLevelId })
      : scene.scene.start("LevelSelect", { worldId: scene.level.world }));
    home.on("pointerup", () => scene.scene.start("CatHouse", { page: scene.level.world }));
    shade.setInteractive();
  }
}
