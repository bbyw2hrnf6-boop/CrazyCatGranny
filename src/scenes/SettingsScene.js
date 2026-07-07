import { SaveGame } from "../savegame/SaveGame.js";
import { toggleFullscreen } from "../systems/FullscreenManager.js";
import { addPaperTexture, COLORS, pill, textStyle, topBar } from "../ui/ui.js";

const ADMIN_PIN = "1702";

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  init(data) {
    this.mainTab = data?.tab === "admin" ? "admin" : "settings";
    this.adminSection = data?.section || "tests";
    this.adminUnlocked = sessionStorage.getItem("ccg-admin-unlocked") === "yes";
    this.content = [];
    this.pin = "";
  }

  create() {
    this.add.image(640, 360, "world-bg-1").setDisplaySize(1280, 720).setAlpha(0.5).setDepth(-20);
    this.add.rectangle(640, 405, 1120, 570, COLORS.cream, 0.96).setStrokeStyle(6, COLORS.ink);
    addPaperTexture(this);
    topBar(this, "SETTINGS", () => this.scene.start("MainMenu"));

    const settings = pill(this, 480, 135, 250, 58, "⚙  SETTINGS", {
      fill: this.mainTab === "settings" ? COLORS.yellow : COLORS.cream,
      size: 20
    });
    const admin = pill(this, 800, 135, 250, 58, "◆  ADMIN", {
      fill: this.mainTab === "admin" ? COLORS.coral : COLORS.cream,
      color: this.mainTab === "admin" ? "#fff7df" : "#2f2335",
      size: 20
    });
    settings.on("pointerup", () => this.scene.restart({ tab: "settings" }));
    admin.on("pointerup", () => this.scene.restart({ tab: "admin", section: this.adminSection }));

    this.pinKeyHandler = (event) => {
      if (this.mainTab !== "admin" || this.adminUnlocked) return;
      if (/^[0-9]$/.test(event.key)) this.addPinDigit(event.key);
      else if (event.key === "Backspace") this.removePinDigit();
      else if (event.key === "Enter") this.submitPin();
    };
    this.input.keyboard?.on("keydown", this.pinKeyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off("keydown", this.pinKeyHandler);
    });

    if (this.mainTab === "admin") this.showAdmin();
    else this.showSettings();
  }

  clearContent() {
    this.content.forEach((item) => item?.destroy());
    this.content = [];
  }

  keep(...items) {
    this.content.push(...items);
    return items.at(-1);
  }

  heading(title, copy, y = 220) {
    this.keep(
      this.add.text(640, y, title, textStyle(30, "#2f2335")).setOrigin(0.5),
      this.add.text(640, y + 38, copy, textStyle(17, "#756376")).setOrigin(0.5)
    );
  }

  showSettings() {
    this.mainTab = "settings";
    this.clearContent();
    const save = SaveGame.load();
    this.heading("PLAYER SETTINGS", "Safe controls for sound and fullscreen.");
    const sound = pill(this, 500, 365, 300, 70, save.sound ? "🔊  SOUND ON" : "🔇  SOUND OFF", {
      fill: save.sound ? COLORS.teal : COLORS.cream,
      color: save.sound ? "#fff7df" : "#2f2335",
      size: 21
    });
    const fullscreen = pill(this, 820, 365, 360, 70, "⛶  FULLSCREEN", {
      fill: COLORS.blue,
      color: "#fff7df",
      size: 18
    });
    const layoutInfo = this.add.text(
      640,
      485,
      "Save sections:  PROGRESSION  ·  INVENTORY  ·  ROOM LAYOUT  ·  SETTINGS",
      textStyle(17, "#5d4c60")
    ).setOrigin(0.5);
    const note = this.add.text(
      640,
      535,
      "Admin tools are PIN protected. Normal players cannot trigger test or reset controls.",
      textStyle(16, "#8a7285")
    ).setOrigin(0.5);
    this.keep(sound, fullscreen, layoutInfo, note);
    sound.on("pointerup", () => {
      save.sound = !save.sound;
      SaveGame.write(save);
      this.showSettings();
    });
    fullscreen.on("pointerup", () => toggleFullscreen(this));
  }

  showAdmin() {
    this.mainTab = "admin";
    if (!this.adminUnlocked) {
      this.showPinGate();
      return;
    }
    this.showAdminSection(this.adminSection);
  }

  showPinGate() {
    this.clearContent();
    this.pin = "";
    this.heading("ADMIN ACCESS", "Type the four-digit PIN. Keyboard and keypad both work.");
    const display = this.add.rectangle(640, 315, 300, 64, 0x2f2335).setStrokeStyle(4, COLORS.yellow);
    this.pinText = this.add.text(640, 317, "○  ○  ○  ○", textStyle(28, "#ffdc61")).setOrigin(0.5);
    this.pinMessage = this.add.text(640, 365, "", textStyle(16, "#ec5966")).setOrigin(0.5);
    this.keep(display, this.pinText, this.pinMessage);

    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "OK"];
    keys.forEach((key, index) => {
      const x = 465 + (index % 3) * 175;
      const y = 420 + Math.floor(index / 3) * 58;
      const button = pill(this, x, y, 145, 46, key, {
        fill: key === "OK" ? COLORS.yellow : COLORS.cream,
        size: 19
      });
      this.keep(button);
      button.on("pointerup", () => {
        if (key === "⌫") this.removePinDigit();
        else if (key === "OK") this.submitPin();
        else this.addPinDigit(key);
      });
    });
  }

  addPinDigit(digit) {
    if (this.pin.length >= 4) return;
    this.pin += digit;
    this.updatePinDisplay();
    if (this.pin.length === 4) this.time.delayedCall(120, () => this.submitPin());
  }

  removePinDigit() {
    this.pin = this.pin.slice(0, -1);
    this.updatePinDisplay();
  }

  updatePinDisplay() {
    this.pinText?.setText(Array.from({ length: 4 }, (_, index) => index < this.pin.length ? "●" : "○").join("  "));
  }

  submitPin() {
    if (this.pin === ADMIN_PIN) {
      sessionStorage.setItem("ccg-admin-unlocked", "yes");
      this.adminUnlocked = true;
      this.adminSection = "tests";
      this.showAdminSection("tests");
      return;
    }
    this.pin = "";
    this.updatePinDisplay();
    this.pinMessage?.setText("WRONG PIN");
    this.cameras.main.shake(100, 0.004);
  }

  showAdminSection(section) {
    this.adminSection = section;
    this.clearContent();
    ["tests", "backup", "resets"].forEach((name, index) => {
      const button = pill(this, 415 + index * 225, 215, 190, 48, name.toUpperCase(), {
        fill: name === section ? COLORS.coral : COLORS.cream,
        color: name === section ? "#fff7df" : "#2f2335",
        size: 16
      });
      this.keep(button);
      button.on("pointerup", () => this.showAdminSection(name));
    });
    const lock = pill(this, 1080, 215, 140, 48, "LOCK", {
      fill: COLORS.ink,
      color: "#fff7df",
      size: 15
    });
    this.keep(lock);
    lock.on("pointerup", () => {
      sessionStorage.removeItem("ccg-admin-unlocked");
      this.adminUnlocked = false;
      this.showPinGate();
    });
    if (section === "backup") this.showBackupTools();
    else if (section === "resets") this.showResetTools();
    else this.showTestTools();
  }

  showTestTools() {
    this.heading("GAMEPLAY LAB", "Launch Level 1 immediately with telemetry. Esc still pauses.", 285);
    [
      ["NORMAL TEST", 1, false, 350],
      ["SLOW 0.50×", 0.5, false, 545],
      ["SLOW 0.25×", 0.25, false, 740],
      ["HITBOX TEST", 0.5, true, 935]
    ].forEach(([label, speed, hitboxes, x]) => {
      const button = pill(this, x, 390, 175, 68, label, {
        fill: hitboxes ? COLORS.teal : speed < 1 ? COLORS.yellow : COLORS.cream,
        color: hitboxes ? "#fff7df" : "#2f2335",
        size: 16
      });
      this.keep(button);
      button.on("pointerup", () => this.scene.start("GameScene", {
        levelId: 1,
        adminTest: true,
        adminTimeScale: speed,
        adminHitboxes: hitboxes
      }));
    });
    this.keep(this.add.text(
      640,
      485,
      "F1 telemetry  ·  F2 hitboxes  ·  F3 slow toggle  ·  F4 skip segment",
      textStyle(16, "#755f76")
    ).setOrigin(0.5));
  }

  showBackupTools() {
    const status = SaveGame.backupStatus();
    this.heading("SAVE BACKUPS", "Manual snapshot stays available after a normal reset.", 285);
    const manualDate = status.manualAt ? new Date(status.manualAt).toLocaleString() : "none";
    this.keep(this.add.text(640, 360, `MANUAL BACKUP: ${manualDate}`, textStyle(17, "#5d4c60")).setOrigin(0.5));
    const create = pill(this, 430, 445, 250, 68, "CREATE BACKUP", { fill: COLORS.yellow, size: 18 });
    const restore = pill(this, 710, 445, 250, 68, "RESTORE MANUAL", { fill: COLORS.teal, color: "#fff7df", size: 18 });
    const auto = pill(this, 990, 445, 250, 68, "RESTORE AUTO", { fill: COLORS.cream, size: 18 });
    this.keep(create, restore, auto);
    create.on("pointerup", () => {
      SaveGame.createManualBackup();
      this.showAdminSection("backup");
    });
    restore.on("pointerup", () => {
      const restored = SaveGame.restoreManualBackup();
      this.showStatus(restored ? "MANUAL BACKUP RESTORED" : "NO MANUAL BACKUP", Boolean(restored));
    });
    auto.on("pointerup", () => {
      const restored = SaveGame.restoreBackup();
      this.showStatus(restored ? "AUTO BACKUP RESTORED" : "NO AUTO BACKUP", Boolean(restored));
    });
  }

  showResetTools() {
    this.heading("SEPARATE RESET TOOLS", "Press a button twice. Manual backup is kept.", 285);
    [
      ["RESET PROGRESSION", "progression", 390, "Keeps items and room"],
      ["RESET ROOM LAYOUT", "layout", 640, "Keeps owned furniture"],
      ["RESET SETTINGS", "settings", 890, "Sound only"]
    ].forEach(([label, section, x, note]) => {
      const button = pill(this, x, 415, 220, 66, label, { fill: COLORS.cream, size: 15 });
      this.keep(
        button,
        this.add.text(x, 465, note, textStyle(12, "#806e80")).setOrigin(0.5)
      );
      this.armDangerButton(button, () => SaveGame.resetSection(section));
    });
    const full = pill(this, 640, 545, 300, 66, "FULL SAVE RESET", {
      fill: COLORS.coral,
      color: "#fff7df",
      size: 18
    });
    this.keep(full);
    this.armDangerButton(full, () => SaveGame.reset());
  }

  armDangerButton(button, action) {
    let armed = false;
    const original = button.label.text;
    button.on("pointerup", () => {
      if (!armed) {
        armed = true;
        button.label.setText("PRESS AGAIN");
        this.time.delayedCall(2500, () => {
          if (!button.active) return;
          armed = false;
          button.label.setText(original);
        });
        return;
      }
      action();
      this.showStatus("RESET COMPLETE", true);
      button.label.setText(original);
      armed = false;
    });
  }

  showStatus(copy, success) {
    this.statusText?.destroy();
    this.statusText = this.add.text(640, 600, copy, textStyle(18, success ? "#29997d" : "#ec5966"))
      .setOrigin(0.5);
    this.content.push(this.statusText);
  }
}
