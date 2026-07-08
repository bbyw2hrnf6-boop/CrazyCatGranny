import { getLevelsForWorld } from "../content/GameContentStats.js";
import { levelById, WORLDS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { catFrameForLevel, createCat } from "../visual/VisualFactory.js";
import { visualItem } from "../visual/VisualCatalog.js";
import { COLORS, sound, textStyle } from "../ui/ui.js";

const MAP_POSITIONS = [
  [105, 545], [250, 475], [326, 347],
  [505, 323], [650, 400], [770, 530],
  [915, 540], [1030, 420], [1162, 265]
];

export class LevelIntroScene extends Phaser.Scene {
  constructor() {
    super("LevelIntroScene");
  }

  init(data) {
    this.level = levelById(data?.levelId || 1);
    this.world = WORLDS[this.level.world - 1];
    this.quickIntro = Boolean(data?.quickIntro);
    this.started = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(this.world.sky);
    this.drawMap();
    this.playKidnap();
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
      const active = level.id === this.level.id;
      const node = this.add.circle(x, y, active ? 44 : 31, active ? COLORS.coral : COLORS.cream, 1).setDepth(1);
      node.setStrokeStyle(active ? 6 : 4, active ? COLORS.yellow : COLORS.ink);
      this.add.text(x, y - 2, level.boss ? "★" : String(index + 1), textStyle(active ? 26 : 18, active ? "#fff7df" : "#553b56"))
        .setOrigin(0.5)
        .setDepth(2);
    });

    this.add.text(640, 74, `${this.world.label.toUpperCase()} · LEVEL ${this.level.id}`, textStyle(25, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(5)
      .setBackgroundColor("#2f2335cc")
      .setPadding(18, 8);
  }

  playKidnap() {
    const index = Math.max(0, (this.level.id - 1) % MAP_POSITIONS.length);
    const [nodeX, nodeY] = MAP_POSITIONS[index];
    const speed = this.quickIntro ? 0.45 : 1;
    const thief = this.add.sprite(Math.max(-40, nodeX - 260), nodeY + 5, "thief-run", 0).setScale(0.2).setDepth(8).play("thief-running");
    const cat = createCat(this, nodeX, nodeY - 42, catFrameForLevel(this.level.id), 0.16).setDepth(7);
    const bubble = this.add.text(nodeX + 5, nodeY - 112, "HELP!", textStyle(25, "#ec5966"))
      .setOrigin(0.5)
      .setDepth(10)
      .setBackgroundColor("#fff7dfdd")
      .setPadding(12, 5);
    const save = SaveGame.load();
    const grannySkin = visualItem(save.selectedGrannySkin);
    const granny = this.add.sprite(Math.max(80, nodeX - 310), nodeY + 45, grannySkin?.texture || "granny-skate", 0)
      .setScale(0.25)
      .setDepth(7)
      .play(grannySkin?.animation || "granny-skating")
      .setAlpha(0);
    const title = this.add.text(640, 635, this.quickIntro ? "Back on the chase..." : this.storyCopy(), textStyle(28, "#2f2335"))
      .setOrigin(0.5)
      .setDepth(12)
      .setBackgroundColor("#fff7dfdd")
      .setPadding(20, 8);
    const skip = this.add.text(1115, 640, "SKIP  →", textStyle(20, "#fff7df"))
      .setOrigin(0.5)
      .setDepth(13)
      .setBackgroundColor("#2f2335cc")
      .setPadding(14, 5)
      .setInteractive({ useHandCursor: true });
    skip.on("pointerup", () => this.startRun());
    this.input.keyboard?.once("keydown-SPACE", () => this.startRun());
    this.input.keyboard?.once("keydown-ENTER", () => this.startRun());

    this.tweens.add({ targets: bubble, y: bubble.y - 8, duration: 280 * speed, yoyo: true, repeat: this.quickIntro ? 2 : 5, ease: "Sine.inOut" });
    this.tweens.add({
      targets: thief,
      x: nodeX - 30,
      duration: 1400 * speed,
      ease: "Sine.inOut",
      onComplete: () => {
        if (this.started) return;
        title.setText("He snatches the cat!");
        this.tweens.add({
          targets: cat,
          x: thief.x - 24,
          y: thief.y - 38,
          scale: 0.045,
          alpha: 0.25,
          duration: 450 * speed,
          ease: "Back.in",
          onComplete: () => {
            if (this.started) return;
            cat.setVisible(false);
            bubble.setText("!");
            title.setText("Granny gives chase!");
            granny.setAlpha(1);
            this.tweens.add({ targets: thief, x: 1380, duration: 1050 * speed, ease: "Quad.in" });
            this.tweens.add({
              targets: granny,
              x: 1320,
              duration: 1180 * speed,
              ease: "Sine.in",
              onComplete: () => this.startRun()
            });
          }
        });
      }
    });
  }

  storyCopy() {
    if (this.level.id === 1) return "The cats are stolen. Granny starts rolling.";
    if (this.level.boss) return "The thief hides behind a bigger problem...";
    return "The thief is on the map...";
  }

  startRun() {
    if (this.started) return;
    this.started = true;
    this.tweens.killAll();
    sound(this, "jump");
    this.scene.start("GameScene", { levelId: this.level.id, skipIntro: true });
  }
}
