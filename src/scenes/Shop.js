import { SaveGame } from "../savegame/SaveGame.js";
import { LEVELS } from "../levels/levels.js";
import { SHOP_ITEMS } from "../visual/VisualCatalog.js";
import { attachCatAccessory, createCat, createItemPreview } from "../visual/VisualFactory.js";
import { addPaperTexture, COLORS, coinBadge, pill, sound, textStyle, topBar } from "../ui/ui.js";

export class Shop extends Phaser.Scene {
  constructor() {
    super("Shop");
  }

  create() {
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    this.activeTab = "HATS";
    this.cameras.main.setBackgroundColor("#f4d8ac");
    this.drawShop();
    addPaperTexture(this);
    topBar(this, "MRS. WHISKERS' EMPORIUM", () => this.scene.start("MainMenu"));
    this.badge = coinBadge(this);
    this.badge.setValue(this.save.coins);
    this.shopHint = this.add.text(54, 122, "BUY CAT ITEMS NOW · CHOOSE A CAT ONLY WHEN YOU EQUIP", textStyle(17, "#80677f")).setOrigin(0);
    this.makeTabs();
    this.renderItems();
  }

  drawShop() {
    this.add.image(640, 360, "shop-bg").setDisplaySize(1280, 720).setDepth(-20);
    const g = this.add.graphics().setAlpha(0.22).setDepth(-10);
    g.fillStyle(0xf4d8ac, 0.08).fillRect(0, 0, 1280, 720);
    g.fillStyle(0xe4b878).fillRect(0, 610, 1280, 110);
    g.fillStyle(0x6e4a54).fillRect(40, 150, 1200, 10).fillRect(40, 590, 1200, 10);
    for (let x = 80; x < 1250; x += 190) {
      g.fillStyle(0xd7a366).fillRect(x, 165, 7, 420);
    }
    g.fillStyle(0xc95d60).fillTriangle(0, 0, 320, 0, 0, 240).fillTriangle(1280, 0, 960, 0, 1280, 240);
  }

  makeTabs() {
    ["HATS", "HOME", "GEAR"].forEach((tab, index) => {
      const button = pill(this, 755 + index * 155, 125, 140, 48, tab, {
        fill: tab === this.activeTab ? COLORS.yellow : COLORS.cream,
        size: 17
      });
      button.on("pointerup", () => {
        this.activeTab = tab;
        this.tabButtons.forEach((entry) => entry.destroy());
        this.itemObjects.forEach((entry) => entry.destroy());
        this.tabButtons = [];
        this.makeTabs();
        this.renderItems();
        this.refreshHint();
      });
      if (!this.tabButtons) this.tabButtons = [];
      this.tabButtons.push(button);
    });
  }

  renderItems() {
    this.itemObjects = [];
    const list = SHOP_ITEMS.filter((item) => item.tab === this.activeTab);
    list.forEach((item, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 205 + col * 290;
      const y = 310 + row * 250;
      const owned = this.save.owned.includes(item.id);
      const equipped = item.tab === "HATS"
        ? Boolean(this.save.hatAssignments[item.id])
        : item.tab === "GEAR" && this.save.equippedGear === item.id;
      const panel = this.add.rectangle(x, y, 245, 205, COLORS.cream).setStrokeStyle(5, COLORS.ink);
      const iconBg = this.add.circle(x, y - 38, 50, item.color, 0.9).setStrokeStyle(4, COLORS.ink);
      const icon = createItemPreview(this, item.id, x, y - 38, { scale: 0.92 });
      const name = this.add.text(x, y + 20, item.name, textStyle(20)).setOrigin(0.5);
      const detail = this.add.text(x, y + 48, item.detail, textStyle(12, "#8a7588")).setOrigin(0.5);
      const hatCat = item.tab === "HATS" && this.save.hatAssignments[item.id]
        ? LEVELS.find((level) => level.cat.id === this.save.hatAssignments[item.id])?.cat.name
        : null;
      const ownedLabel = item.tab === "HOME"
        ? this.save.activeDecor.includes(item.id) ? "PLACED" : "IN STORAGE"
        : item.tab === "HATS" && hatCat
          ? `ON ${hatCat.toUpperCase()}`
          : equipped
            ? "EQUIPPED"
            : "TAP TO EQUIP";
      const price = this.add.text(x, y + 76, owned ? ownedLabel : `● ${item.price}`, textStyle(15, owned ? "#3f9f7c" : "#7a6077")).setOrigin(0.5);
      const hit = this.add.rectangle(x, y, 245, 205, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => {
        this.tweens.add({ targets: [panel, iconBg, name, price], scale: 1.035, duration: 90 });
        this.tweens.add({ targets: icon, scale: 1.08, duration: 110, ease: "Back.out" });
      });
      hit.on("pointerout", () => {
        this.tweens.add({ targets: [panel, iconBg, name, price], scale: 1, duration: 90 });
        this.tweens.add({ targets: icon, scale: 1, duration: 110 });
      });
      hit.on("pointerup", () => this.handleItem(item, owned));
      this.itemObjects.push(panel, iconBg, icon, name, detail, price, hit);
    });
  }

  handleItem(item, owned) {
    if (owned && item.tab === "HATS") {
      this.openCatPicker(item);
      return;
    }
    if (owned && item.tab === "GEAR") {
      SaveGame.equipGear(this.save.equippedGear === item.id ? "none" : item.id);
      this.save = SaveGame.load();
      this.registry.set("save", this.save);
      this.refresh();
      this.toast(this.save.equippedGear === item.id ? "Granny geared up!" : "Gear unequipped!");
      return;
    }
    if (owned) {
      this.toast("Already yours, hero!");
      return;
    }
    if (!SaveGame.buy(item)) {
      this.toast("Need more shiny coins!");
      return;
    }
    this.save = SaveGame.load();
    if (item.tab === "GEAR") SaveGame.equipGear(item.id);
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    sound(this, "buy");
    this.badge.setValue(this.save.coins);
    this.refresh();
    if (item.tab === "HATS") {
      this.toast(`${item.name} added to your items!`);
      this.openCatPicker(item);
    } else this.toast(`${item.name} unlocked!`);
  }

  refresh() {
    this.itemObjects.forEach((entry) => entry.destroy());
    this.renderItems();
    this.badge.setValue(this.save.coins);
    this.refreshHint();
  }

  refreshHint() {
    this.shopHint.setText(
      this.activeTab === "HATS"
        ? "CAT ITEMS · BUY FIRST, THEN EQUIP TO ONE CAT"
        : this.activeTab === "GEAR"
          ? "GRANNY GEAR · ONE ACTIVE POWER AT A TIME"
          : "HOME ITEMS · AUTOMATICALLY APPEAR IN THE CAT HOUSE"
    );
  }

  openCatPicker(item, page = 0) {
    this.closeCatPicker();
    const rescued = LEVELS.filter((level) => this.save.rescuedCats.includes(level.cat.id));
    const pageSize = 12;
    const pageCount = Math.max(1, Math.ceil(rescued.length / pageSize));
    const safePage = Phaser.Math.Clamp(page, 0, pageCount - 1);
    const shown = rescued.slice(safePage * pageSize, safePage * pageSize + pageSize);
    const parts = [];
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.72).setDepth(60).setInteractive();
    const panel = this.add.rectangle(640, 360, 960, 610, COLORS.cream).setDepth(61);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 92, `EQUIP ${item.name.toUpperCase()}`, textStyle(32, "#ec5966")).setOrigin(0.5).setDepth(62);
    const sub = this.add.text(640, 130, rescued.length ? "Choose one rescued cat · or close to keep item in inventory" : "No rescued cats yet · item stays safely in inventory", textStyle(16, "#725f72")).setOrigin(0.5).setDepth(62);
    parts.push(shade, panel, title, sub);

    shown.forEach((level, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 355 + col * 190;
      const y = 225 + row * 140;
      const assigned = this.save.hatAssignments[item.id] === level.cat.id;
      const card = this.add.rectangle(x, y, 154, 116, assigned ? COLORS.yellow : 0xffffff, 0.94).setDepth(62);
      card.setStrokeStyle(4, assigned ? COLORS.coral : COLORS.ink);
      const cat = createCat(this, x, y - 12, level.id - 1, 0.14).setDepth(63);
      const previewHat = attachCatAccessory(this, cat, item.id, 64);
      const name = this.add.text(x, y + 45, level.cat.name, textStyle(14)).setOrigin(0.5).setDepth(64);
      const hit = this.add.rectangle(x, y, 154, 116, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(65);
      hit.on("pointerup", () => {
        SaveGame.assignHat(item.id, level.cat.id);
        this.save = SaveGame.load();
        this.registry.set("save", this.save);
        this.closeCatPicker();
        this.refresh();
        this.toast(`${item.name} equipped to ${level.cat.name}!`);
      });
      parts.push(card, cat, previewHat, name, hit);
    });

    if (pageCount > 1) {
      const previous = pill(this, 490, 636, 70, 46, "‹", { fill: COLORS.cream, size: 24 }).setDepth(64);
      const pageText = this.add.text(640, 636, `${safePage + 1} / ${pageCount}`, textStyle(17)).setOrigin(0.5).setDepth(64);
      const next = pill(this, 790, 636, 70, 46, "›", { fill: COLORS.cream, size: 24 }).setDepth(64);
      previous.on("pointerup", () => this.openCatPicker(item, safePage - 1 < 0 ? pageCount - 1 : safePage - 1));
      next.on("pointerup", () => this.openCatPicker(item, (safePage + 1) % pageCount));
      parts.push(previous, pageText, next);
    }
    const close = pill(this, 1050, 105, 110, 44, "CLOSE", { fill: COLORS.yellow, size: 15 }).setDepth(64);
    close.on("pointerup", () => this.closeCatPicker());
    parts.push(close);
    this.pickerParts = parts;
  }

  closeCatPicker() {
    this.pickerParts?.forEach((item) => item.destroy());
    this.pickerParts = null;
  }

  toast(message) {
    this.toastParts?.forEach((item) => item.destroy());
    const bg = this.add.rectangle(640, 660, 440, 55, COLORS.ink, 0.95).setDepth(30);
    bg.setStrokeStyle(3, COLORS.cream);
    const label = this.add.text(640, 661, message, textStyle(19, "#fff7df")).setOrigin(0.5).setDepth(31);
    this.toastParts = [bg, label];
    this.time.delayedCall(1500, () => {
      this.toastParts?.forEach((item) => item.destroy());
      this.toastParts = null;
    });
  }
}
