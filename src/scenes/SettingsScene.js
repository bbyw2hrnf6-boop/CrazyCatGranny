import { SaveGame } from "../savegame/SaveGame.js";
import { AdminDebugPanel } from "../admin/AdminDebugPanel.js";
import { toggleFullscreen } from "../systems/FullscreenManager.js";
import { addPaperTexture, COLORS, pill, textStyle, topBar } from "../ui/ui.js";

const ADMIN_PIN = "1702";

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super("SettingsScene");
  }

  init(data) {
    this.mainTab = data?.tab === "admin" ? "admin" : "settings";
    this.adminSection = data?.section || "quick";
    this.adminUnlocked = sessionStorage.getItem("ccg-admin-unlocked") === "yes";
    this.content = [];
    this.pin = "";
    this.adminPanel = null;
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
      this.adminSection = "quick";
      this.showAdminSection("quick");
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
    this.adminPanel = this.adminPanel || new AdminDebugPanel(this);
    this.keep(...this.adminPanel.render(section));
  }
}
