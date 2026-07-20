import { storyForLevel } from "../content/story/StoryCatalog.js";
import { levelById, worldById } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import {
  catFrameForLevel,
  createCat,
  resolveAnimationKey,
  resolveVisualTexture
} from "../visual/VisualFactory.js";
import { visualItem } from "../visual/VisualCatalog.js";
import { COLORS, pill, sound, textStyle } from "../ui/ui.js";

export class StoryScene extends Phaser.Scene {
  constructor() {
    super("StoryScene");
  }

  init(data) {
    this.level = levelById(data?.levelId || 1);
    this.world = worldById(this.level.world);
    this.story = storyForLevel(this.level);
    this.beatIndex = 0;
    this.finished = false;
  }

  create() {
    if (!this.story) {
      this.scene.start("LevelIntroScene", { levelId: this.level.id });
      return;
    }
    this.cameras.main.setBackgroundColor(this.world.sky);
    this.drawCinematic();
    this.createActors();
    this.createDialogue();
    this.bindControls();
    this.cameras.main.fadeIn(280, 20, 14, 26);
    this.showBeat(0);
  }

  drawCinematic() {
    this.backdrop = this.add.image(650, 355, `world-bg-${this.level.world}`)
      .setDisplaySize(1380, 776)
      .setDepth(-20);
    this.add.rectangle(640, 360, 1280, 720, this.world.sky, 0.12).setDepth(-19);
    this.add.rectangle(640, 360, 1280, 720, 0x1d1422, 0.14).setDepth(-18);
    this.tweens.add({ targets: this.backdrop, x: 620, scaleX: 1.035, scaleY: 1.035, duration: 12000, ease: "Sine.inOut" });
    this.add.rectangle(640, 24, 1280, 48, 0x130e18, 0.96).setDepth(40);
    this.add.rectangle(640, 706, 1280, 28, 0x130e18, 0.96).setDepth(40);
    this.add.text(48, 24, this.story.kicker, textStyle(17, "#ffdc61")).setOrigin(0, 0.5).setDepth(41);
    this.add.text(640, 78, this.story.title.toUpperCase(), textStyle(31, "#fff7df", {
      stroke: "#2f2335",
      strokeThickness: 7
    })).setOrigin(0.5).setDepth(20);
    this.progressText = this.add.text(1010, 24, "1 / 3", textStyle(15, "#fff7df")).setOrigin(0.5).setDepth(41);
    const skip = pill(this, 1175, 63, 150, 48, "SKIP STORY", { fill: COLORS.cream, size: 16 }).setDepth(42);
    skip.on("pointerup", () => this.finishStory());
  }

  createActors() {
    const save = SaveGame.load();
    const grannySkin = visualItem(save.selectedGrannySkin);
    const thiefSkin = visualItem(save.selectedThiefSkin);
    this.granny = this.add.sprite(230, 445, resolveVisualTexture(this, grannySkin, "granny-skate"), 0)
      .setScale(0.36)
      .setDepth(12)
      .play(resolveAnimationKey(this, grannySkin, "granny-skating"));
    this.thief = this.add.sprite(1040, 430, resolveVisualTexture(this, thiefSkin, "thief-run"), 0)
      .setScale(0.21)
      .setFlipX(true)
      .setDepth(12)
      .play(resolveAnimationKey(this, thiefSkin, "thief-running"));
    this.cat = createCat(this, 820, 470, catFrameForLevel(this.level.id), 0.22).setDepth(13);
    this.add.ellipse(230, 548, 220, 28, 0x1d1422, 0.28).setDepth(7);
    this.add.ellipse(1040, 528, 175, 24, 0x1d1422, 0.28).setDepth(7);
    this.add.ellipse(820, 535, 130, 20, 0x1d1422, 0.24).setDepth(7);
    this.tweens.add({ targets: this.granny, y: 450, duration: 850, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.tweens.add({ targets: this.thief, angle: 4, duration: 620, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.tweens.add({ targets: this.cat, y: 462, duration: 720, yoyo: true, repeat: -1, ease: "Sine.inOut" });
  }

  createDialogue() {
    const panel = this.add.rectangle(640, 618, 1160, 154, COLORS.cream, 0.97).setDepth(30);
    panel.setStrokeStyle(7, COLORS.ink);
    this.speakerText = this.add.text(92, 560, "", textStyle(18, "#fff7df"))
      .setDepth(32)
      .setBackgroundColor("#ec5966")
      .setPadding(14, 5);
    this.dialogueText = this.add.text(92, 607, "", textStyle(25, "#2f2335", {
      wordWrap: { width: 870 },
      lineSpacing: 4
    })).setOrigin(0, 0.5).setDepth(32);
    this.nextButton = pill(this, 1090, 640, 190, 58, "NEXT  →", { fill: COLORS.yellow, size: 19 }).setDepth(33);
    this.nextButton.on("pointerup", () => this.advanceBeat());
    this.autoText = this.add.text(1088, 591, "AUTO PLAYING", textStyle(12, "#756376")).setOrigin(0.5).setDepth(33);
  }

  bindControls() {
    this.input.keyboard?.on("keydown-SPACE", () => this.advanceBeat());
    this.input.keyboard?.on("keydown-ENTER", () => this.advanceBeat());
    this.input.keyboard?.on("keydown-ESC", () => this.finishStory());
  }

  showBeat(index) {
    this.beatIndex = index;
    const beat = this.story.beats[index];
    if (!beat) {
      this.finishStory();
      return;
    }
    this.progressText.setText(`${index + 1} / ${this.story.beats.length}`);
    this.currentBeat = beat;
    this.typing = true;
    this.speakerText.setText(beat.speaker);
    this.dialogueText.setText("");
    this.typeTimer?.remove(false);
    this.autoTimer?.remove(false);
    this.focusActor(beat.actor);
    let character = 0;
    this.typeTimer = this.time.addEvent({
      delay: 16,
      repeat: Math.max(0, beat.text.length - 1),
      callback: () => {
        character += 1;
        this.dialogueText.setText(beat.text.slice(0, character));
        if (character >= beat.text.length) this.typing = false;
      }
    });
    this.autoTimer = this.time.delayedCall(Math.max(3000, beat.text.length * 30 + 1700), () => this.advanceBeat());
    this.nextButton.label.setText(index === this.story.beats.length - 1 ? "CHASE  →" : "NEXT  →");
  }

  focusActor(actor) {
    const actors = { granny: this.granny, thief: this.thief, cat: this.cat };
    Object.entries(actors).forEach(([key, sprite]) => {
      const focused = actor === "narrator" || key === actor;
      sprite.setAlpha(focused ? 1 : 0.48);
      this.tweens.add({ targets: sprite, scaleX: sprite.scaleX * (focused ? 1.06 : 0.98), duration: 160, yoyo: true, ease: "Back.out" });
    });
    const target = actors[actor];
    if (target) this.tweens.add({ targets: target, x: target.x + (actor === "thief" ? -12 : 12), duration: 170, yoyo: true, ease: "Sine.inOut" });
    if (actor === "cat") sound(this, "meow2");
  }

  advanceBeat() {
    if (this.finished) return;
    if (this.typing && this.currentBeat) {
      this.typeTimer?.remove(false);
      this.dialogueText.setText(this.currentBeat.text);
      this.typing = false;
      return;
    }
    this.showBeat(this.beatIndex + 1);
  }

  finishStory() {
    if (this.finished) return;
    this.finished = true;
    this.typeTimer?.remove(false);
    this.autoTimer?.remove(false);
    SaveGame.markStorySeen(this.story.id);
    this.cameras.main.fadeOut(240, 20, 14, 26);
    this.time.delayedCall(250, () => this.scene.start("LevelIntroScene", { levelId: this.level.id }));
  }
}
