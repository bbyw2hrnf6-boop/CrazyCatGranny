import { SaveGame } from "../savegame/SaveGame.js";
import { addDetailedCat, animateCat } from "../objects/Cat.js";
import { addGrannyGear } from "../objects/Outfits.js";
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

    const badge = coinBadge(this);
    badge.setValue(save.coins);
    this.add.text(72, 638, `CATS HOME  ${save.rescuedCats.length}/45   ·   WORLD CUPS ${save.worldTrophies.length}/5`, textStyle(20, "#fff7df")).setOrigin(0, 0.5);
    const progressBg = this.add.rectangle(72, 675, 390, 14, 0x2f2335, 0.35).setOrigin(0, 0.5);
    progressBg.setStrokeStyle(2, COLORS.cream, 0.7);
    this.add.rectangle(72, 675, 390 * (save.rescuedCats.length / 45), 10, COLORS.coral).setOrigin(0, 0.5);
    this.input.keyboard?.on("keydown-ENTER", () => this.scene.start("LevelSelect"));
  }

  drawHouse(save) {
    const g = this.add.graphics();
    g.fillStyle(0x6ebdc8).fillRect(0, 0, 1280, 720);
    g.fillStyle(0xd8f2e8).fillCircle(960, 110, 68);
    g.fillStyle(0xffffff, 0.8).fillEllipse(890, 140, 170, 50).fillEllipse(1120, 80, 150, 42);
    g.fillStyle(0x5b9a4c).fillRect(0, 590, 1280, 130);
    g.fillStyle(0x427f47).fillEllipse(900, 600, 750, 140);
    g.fillStyle(0x593b4c).fillRect(665, 210, 550, 390);
    g.fillStyle(0xffe4ad).fillRect(685, 230, 510, 360);
    g.fillStyle(0xc95759).fillTriangle(620, 230, 935, 50, 1250, 230);
    g.fillStyle(0x9f3f4c).fillRect(1110, 85, 52, 110);
    g.fillStyle(0x7a4f3b).fillRoundedRect(885, 405, 130, 185, 8);
    g.fillStyle(0x3c8094).fillRect(735, 300, 115, 105).fillRect(1050, 285, 105, 120);
    g.lineStyle(9, 0xfff2cf).strokeRect(735, 300, 115, 105).strokeRect(1050, 285, 105, 120);
    g.lineStyle(5, 0xfff2cf).beginPath().moveTo(792, 300).lineTo(792, 405).moveTo(735, 352).lineTo(850, 352).moveTo(1102, 285).lineTo(1102, 405).moveTo(1050, 345).lineTo(1155, 345).strokePath();
    g.fillStyle(0x3b2a34).fillCircle(988, 500, 6);
    g.fillStyle(0xf3bc54).fillCircle(1125, 160, 22);
    g.fillStyle(0x315d37).fillRoundedRect(625, 515, 145, 86, 30).fillRoundedRect(1160, 495, 120, 110, 35);

    const granny = this.add.sprite(815, 525, "granny-skate", 0).setScale(0.34).play("granny-skating");
    this.tweens.add({ targets: granny, y: 530, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    const gear = addGrannyGear(this, granny, save.equippedGear, 8);
    if (gear) this.tweens.add({ targets: gear, y: gear.y - 5, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    const thief = this.add.sprite(1115, 207, "thief-run", 0).setScale(0.16).setAngle(4).play("thief-running");
    this.tweens.add({ targets: thief, angle: -4, duration: 700, yoyo: true, repeat: -1 });

    const count = Math.max(1, Math.min(4, save.rescuedCats.length));
    const positions = [[730, 548], [1065, 553], [950, 335], [1180, 560]];
    for (let i = 0; i < count; i += 1) {
      const cat = addDetailedCat(this, positions[i][0], positions[i][1], i, i > 1 ? 0.19 : 0.22);
      if (i % 2) cat.setFlipX(true);
      animateCat(this, cat, { duration: 750 + i * 90, bob: 6 });
    }
  }
}
