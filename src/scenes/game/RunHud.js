import { toggleFullscreen } from "../../systems/FullscreenManager.js";
import { COLORS, pill, textStyle } from "../../ui/ui.js";

export class RunHud {
  constructor(scene) {
    this.scene = scene;
  }

  create() {
    const scene = this.scene;
    const compact = this.compact();
    const titleWidth = compact ? 470 : 560;
    const bar = scene.add.rectangle(20, 20, 1240, 74, COLORS.ink, 0.9).setOrigin(0).setScrollFactor(0).setDepth(50);
    bar.setStrokeStyle(3, COLORS.cream, 0.9);
    scene.add.text(48, 56, `${scene.level.id}  ${scene.level.title}`, textStyle(compact ? 20 : 25, "#fff7df", {
      wordWrap: { width: titleWidth },
      align: "left"
    }))
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.coinIcon = scene.add.image(790, 56, "coin").setScale(0.55).setScrollFactor(0).setDepth(51);
    scene.coinText = scene.add.text(825, 58, "0", textStyle(24, "#fff7df")).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.treatIcon = scene.add.image(900, 56, "treat").setScale(0.48).setScrollFactor(0).setDepth(51);
    scene.treatText = scene.add.text(937, 58, "0/3", textStyle(24, "#fff7df")).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.timeText = scene.add.text(1050, 57, "0:00.0", textStyle(24, "#ffdc61")).setOrigin(0, 0.5).setScrollFactor(0).setDepth(51);
    scene.progressBg = scene.add.rectangle(20, 94, 1240, 8, 0x2f2335, 0.35).setOrigin(0).setScrollFactor(0).setDepth(50);
    scene.progress = scene.add.rectangle(20, 94, 0, 8, COLORS.coral).setOrigin(0).setScrollFactor(0).setDepth(51);
    scene.thiefMarker = scene.add.triangle(20, 103, 0, 0, 12, 0, 6, 13, COLORS.yellow)
      .setOrigin(0.5, 0).setScrollFactor(0).setDepth(52);
    scene.escapeText = scene.add.text(650, 58, "THIEF  0:00", textStyle(17, "#ffdc61"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(52);
    scene.boostText = scene.add.text(640, 158, "⚡ HOOK BOOST", textStyle(18, "#fff7df"))
      .setOrigin(0.5).setScrollFactor(0).setDepth(53).setBackgroundColor("#41b9ad").setPadding(14, 6).setVisible(false);
    const fullscreen = pill(scene, 1128, 140, 76, 55, "⛶", { fill: COLORS.yellow, size: 22 });
    fullscreen.setScrollFactor(0).setDepth(55).on("pointerup", () => toggleFullscreen(scene));
    const pause = pill(scene, 1210, 140, 76, 55, "Ⅱ", { fill: COLORS.cream, size: 24 });
    pause.setScrollFactor(0).setDepth(55).on("pointerup", () => scene.togglePause());
    if (scene.adminTest) {
      const adminBack = pill(scene, 1046, 140, 76, 55, "←", { fill: COLORS.cream, size: 24 });
      adminBack.setScrollFactor(0).setDepth(55).on("pointerup", () => scene.scene.start("SettingsScene", { tab: "admin" }));
    }
    if (scene.level.boss) {
      const boss = scene.add.text(640, 120, "★  BOSS RUN · WORLD TROPHY  ★", textStyle(18, "#fff7df"))
        .setOrigin(0.5).setScrollFactor(0).setDepth(53).setBackgroundColor("#ec5966").setPadding(16, 6);
      scene.tweens.add({ targets: boss, scale: 1.045, duration: 600, yoyo: true, repeat: -1 });
      scene.bossHealthText = scene.add.text(640, 198, "BOSS  ♥ ♥ ♥", textStyle(18, "#fff7df"))
        .setOrigin(0.5).setScrollFactor(0).setDepth(53).setBackgroundColor("#4a354e").setPadding(14, 5);
    }
  }

  compact() {
    const display = this.scene.scale?.displaySize;
    return Boolean(display && (display.width < 780 || display.height < 460));
  }

  update() {
    const scene = this.scene;
    scene.coinText.setText(String(scene.coinsCollected));
    scene.treatText.setText(`${scene.treatsCollected}/3`);
    const minutes = Math.floor(scene.elapsed / 60);
    const seconds = (scene.elapsed % 60).toFixed(1).padStart(4, "0");
    scene.timeText.setText(`${minutes}:${seconds}`);
    scene.progress.width = 1240 * Phaser.Math.Clamp(scene.granny.x / (scene.level.length - 250), 0, 1);
    const thiefRatio = Phaser.Math.Clamp(scene.thiefProgress / (scene.level.length - 250), 0, 1);
    scene.thiefMarker.x = 20 + 1240 * thiefRatio;
    const remaining = Math.max(0, scene.escapeLimit - scene.elapsed);
    scene.escapeText.setText(`THIEF  ${Math.floor(remaining / 60)}:${Math.ceil(remaining % 60).toString().padStart(2, "0")}`);
    scene.escapeText.setColor(remaining < 8 ? "#ff7180" : "#ffdc61");
  }
}
