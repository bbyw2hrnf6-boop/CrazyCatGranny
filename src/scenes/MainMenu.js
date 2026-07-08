import { SaveGame } from "../savegame/SaveGame.js";
import { LEVELS } from "../levels/levels.js";
import { getTotalCatCount, getWorldCount } from "../content/GameContentStats.js";
import {
  animateCat,
  attachCatAccessory,
  createCat,
  createGrannyGear,
  syncCatAccessory,
  syncGrannyGear
} from "../visual/VisualFactory.js";
import { visualItem } from "../visual/VisualCatalog.js";
import { toggleFullscreen } from "../systems/FullscreenManager.js";
import { addPaperTexture, COLORS, coinBadge, iconButton, pill, textStyle } from "../ui/ui.js";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const save = SaveGame.load();
    this.registry.set("save", save);
    this.cameras.main.setBackgroundColor("#91dfe5");
    this.drawHouse(save);
    addPaperTexture(this);

    this.add.text(64, 45, "CRAZY CAT", textStyle(33, "#ec5966", { stroke: "#fff7df", strokeThickness: 8 })).setOrigin(0);
    this.add.text(60, 82, "GRANNY", textStyle(78, "#2f2335", { stroke: "#fff7df", strokeThickness: 12 })).setOrigin(0);
    this.add.text(65, 172, "SKATE. SWING. SAVE THE CATS.", textStyle(18, "#5b465f")).setOrigin(0);

    const play = pill(this, 255, 280, 390, 96, "▶  CHASE THE THIEF", {
      fill: COLORS.yellow,
      size: 31,
      strokeWidth: 6
    });
    play.on("pointerup", () => this.scene.start("LevelSelect"));

    iconButton(this, 160, 397, "🏠", "CAT HOUSE", COLORS.cream, () => this.scene.start("CatHouse"));
    iconButton(this, 375, 397, "🛍", "SHOP", COLORS.cream, () => this.scene.start("Shop"));
    iconButton(this, 160, 494, "🏆", "TROPHIES", COLORS.cream, () => this.scene.start("TrophyRoom"));
    iconButton(this, 375, 494, save.sound ? "🔊" : "🔇", "SOUND", COLORS.cream, () => {
      save.sound = !save.sound;
      SaveGame.write(save);
      this.scene.restart();
    });
    if (save.pendingCatBoxes.length) {
      const boxes = pill(this, 255, 588, 390, 58, `!  OPEN CATBOX x${save.pendingCatBoxes.length}`, {
        fill: COLORS.coral,
        color: "#fff7df",
        size: 19
      });
      boxes.on("pointerup", () => this.scene.start("CatHouse", { openBoxes: true }));
    }

    const badge = coinBadge(this);
    badge.setValue(save.coins);
    const settings = pill(this, 1035, 50, 66, 54, "⚙", { fill: COLORS.cream, size: 25 });
    settings.on("pointerup", () => this.scene.start("SettingsScene"));
    const fullscreen = pill(this, 955, 50, 66, 54, "⛶", { fill: COLORS.yellow, size: 25 });
    fullscreen.on("pointerup", () => toggleFullscreen(this));
    this.add.text(72, 638, `CATS HOME  ${save.rescuedCats.length}/${getTotalCatCount()}   ·   WORLD CUPS ${save.worldTrophies.length}/${getWorldCount()}`, textStyle(20, "#fff7df")).setOrigin(0, 0.5);
    const progressBg = this.add.rectangle(72, 675, 390, 14, 0x2f2335, 0.35).setOrigin(0, 0.5);
    progressBg.setStrokeStyle(2, COLORS.cream, 0.7);
    this.add.rectangle(72, 675, 390 * (save.rescuedCats.length / getTotalCatCount()), 10, COLORS.coral).setOrigin(0, 0.5);
    this.input.keyboard?.on("keydown-ENTER", () => this.scene.start("LevelSelect"));
  }

  drawHouse(save) {
    this.add.image(640, 360, "world-bg-1").setDisplaySize(1280, 720).setDepth(-20);
    this.add.rectangle(250, 360, 500, 720, 0x2f2335, 0.16).setDepth(-8);
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0x24182b, 0.2).fillEllipse(835, 566, 290, 35);
    g.fillStyle(0xfff0aa, 0.13).fillCircle(1030, 185, 115);
    for (let i = 0; i < 18; i += 1) {
      g.fillStyle(i % 2 ? 0xffffff : 0xffd65c, 0.32)
        .fillCircle(620 + i * 35, 140 + (i % 5) * 68, 2 + (i % 3));
    }

    const granny = this.add.sprite(815, 525, "granny-skate", 0).setScale(0.34).play("granny-skating");
    const grannySkin = visualItem(save.selectedGrannySkin);
    if (grannySkin?.tint) granny.setTint(grannySkin.tint);
    this.tweens.add({ targets: granny, y: 530, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    const gear = createGrannyGear(this, granny, save.equippedGear, 8, SaveGame.gearAdjustment(save.equippedGear));
    if (gear) this.events.on("update", () => syncGrannyGear(gear, granny));
    const thief = this.add.sprite(1115, 300, "thief-run", 0).setScale(0.16).setAngle(4).play("thief-running");
    const thiefSkin = visualItem(save.selectedThiefSkin);
    if (thiefSkin?.tint) thief.setTint(thiefSkin.tint);
    this.tweens.add({ targets: thief, angle: -4, duration: 700, yoyo: true, repeat: -1 });

    const rescued = LEVELS.filter((level) => save.rescuedCats.includes(level.cat.id)).slice(0, 4);
    const count = Math.max(1, rescued.length);
    const positions = [[730, 548], [1065, 553], [950, 555], [1180, 560]];
    for (let i = 0; i < count; i += 1) {
      const level = rescued[i] || LEVELS[0];
      const cat = createCat(this, positions[i][0], positions[i][1], level.id - 1, i > 1 ? 0.19 : 0.22);
      if (i % 2) cat.setFlipX(true);
      animateCat(this, cat, { duration: 750 + i * 90, bob: 6 });
      const hatId = SaveGame.hatForCat(level.cat.id);
      const hat = attachCatAccessory(this, cat, hatId, 9, SaveGame.hatAdjustment(level.cat.id, hatId));
      if (hat) this.events.on("update", () => syncCatAccessory(cat, hat));
    }
  }
}
