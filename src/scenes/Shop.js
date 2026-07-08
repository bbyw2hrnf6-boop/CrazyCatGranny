import { SaveGame } from "../savegame/SaveGame.js";
import { LEVELS } from "../levels/levels.js";
import { GRANNY_GEAR_ANCHORS, SHOP_ITEMS, visualItem } from "../visual/VisualCatalog.js";
import {
  attachCatAccessory,
  createCat,
  createGrannyGear,
  createItemPreview,
  setGrannyGearAdjustment,
  syncGrannyGear
} from "../visual/VisualFactory.js";
import { addPaperTexture, COLORS, coinBadge, pill, sound, textStyle, topBar } from "../ui/ui.js";

export class Shop extends Phaser.Scene {
  constructor() {
    super("Shop");
  }

  create() {
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    this.input.addPointer(1);
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

  update() {
    this.updateGrannyEditorPinch();
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

  catDisplayName(level) {
    return SaveGame.catName(level.cat.id, level.cat.name);
  }

  makeTabs() {
    ["HATS", "HOME", "GEAR", "GRANNY", "THIEF", "ROOM"].forEach((tab, index) => {
      const button = pill(this, 430 + index * 132, 125, 118, 48, tab, {
        fill: tab === this.activeTab ? COLORS.yellow : COLORS.cream,
        size: tab.length > 5 ? 13 : 15
      });
      button.on("pointerup", () => {
        this.closeGrannyEditor();
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
    const compact = list.length > 8;
    const columns = compact ? 6 : 4;
    const cardWidth = compact ? 178 : 245;
    const cardHeight = compact ? 162 : 205;
    const xStart = compact ? 155 : 205;
    const xGap = compact ? 194 : 290;
    const yStart = compact ? 280 : 310;
    const yGap = compact ? 185 : 250;
    const iconRadius = compact ? 38 : 50;
    list.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = xStart + col * xGap;
      const y = yStart + row * yGap;
      const owned = this.save.owned.includes(item.id);
      const equipped = item.tab === "HATS"
        ? Boolean(this.save.hatAssignments[item.id])
        : item.tab === "GEAR"
          ? this.save.equippedGear === item.id
          : item.tab === "GRANNY"
            ? this.save.selectedGrannySkin === item.id
            : item.tab === "THIEF"
              ? this.save.selectedThiefSkin === item.id
              : item.tab === "ROOM" && this.save.selectedRoomStyle === item.id;
      const panel = this.add.rectangle(x, y, cardWidth, cardHeight, COLORS.cream).setStrokeStyle(5, COLORS.ink);
      const iconBg = this.add.circle(x, y - (compact ? 32 : 38), iconRadius, item.color, 0.9).setStrokeStyle(4, COLORS.ink);
      const icon = createItemPreview(this, item.id, x, y - (compact ? 32 : 38), { scale: compact ? 0.72 : 0.92 });
      const name = this.add.text(x, y + (compact ? 17 : 20), item.name, textStyle(compact ? 15 : 20, "#2f2335", {
        wordWrap: { width: cardWidth - 18 },
        align: "center"
      })).setOrigin(0.5);
      const detail = this.add.text(x, y + (compact ? 41 : 48), item.detail, textStyle(compact ? 10 : 12, "#8a7588", {
        wordWrap: { width: cardWidth - 18 },
        align: "center"
      })).setOrigin(0.5);
      const assignedLevel = item.tab === "HATS" && this.save.hatAssignments[item.id]
        ? LEVELS.find((level) => level.cat.id === this.save.hatAssignments[item.id])
        : null;
      const hatCat = assignedLevel
        ? this.catDisplayName(assignedLevel)
        : null;
      const hatCatLabel = hatCat && hatCat.length > (compact ? 8 : 13)
        ? `${hatCat.slice(0, compact ? 7 : 12)}...`
        : hatCat;
      const ownedLabel = item.tab === "HOME"
        ? this.save.activeDecor.includes(item.id) ? "PLACED" : "IN STORAGE"
        : item.tab === "HATS" && hatCatLabel
          ? `ON ${hatCatLabel.toUpperCase()}`
          : equipped
            ? "EQUIPPED"
            : "TAP TO EQUIP";
      const price = this.add.text(x, y + (compact ? 67 : 76), owned ? ownedLabel : `● ${item.price}`, textStyle(compact ? 12 : 15, owned ? "#3f9f7c" : "#7a6077")).setOrigin(0.5);
      const hit = this.add.rectangle(x, y, cardWidth, cardHeight, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
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
      this.openGrannyEditor(item);
      return;
    }
    if (owned && item.tab === "GRANNY") {
      SaveGame.equipGrannySkin(item.id);
      this.save = SaveGame.load();
      this.registry.set("save", this.save);
      this.refresh();
      this.toast(`${item.name} equipped!`);
      return;
    }
    if (owned && item.tab === "THIEF") {
      SaveGame.equipThiefSkin(item.id);
      this.save = SaveGame.load();
      this.registry.set("save", this.save);
      this.refresh();
      this.toast(`${item.name} equipped!`);
      return;
    }
    if (owned && item.tab === "ROOM") {
      SaveGame.equipRoomStyle(item.id);
      this.save = SaveGame.load();
      this.registry.set("save", this.save);
      this.refresh();
      this.toast(`${item.name} applied to Cat House!`);
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
    if (item.tab === "GRANNY") SaveGame.equipGrannySkin(item.id);
    if (item.tab === "THIEF") SaveGame.equipThiefSkin(item.id);
    if (item.tab === "ROOM") SaveGame.equipRoomStyle(item.id);
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    sound(this, "buy");
    this.badge.setValue(this.save.coins);
    this.refresh();
    if (item.tab === "HATS") {
      this.toast(`${item.name} added to your items!`);
      this.openCatPicker(item);
    } else if (item.tab === "GEAR") {
      this.toast(`${item.name} unlocked!`);
      this.openGrannyEditor(item);
    } else if (item.tab === "GRANNY" || item.tab === "THIEF") {
      this.toast(`${item.name} equipped!`);
    } else if (item.tab === "ROOM") {
      this.toast(`${item.name} applied to Cat House!`);
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
          : this.activeTab === "GRANNY"
            ? "GRANNY SKINS · FULL VISUAL SWAPS, SAME GAMEPLAY"
            : this.activeTab === "THIEF"
              ? "THIEF SKINS · CHASER LOOK ONLY, NO RULE CHANGES"
              : this.activeTab === "ROOM"
                ? "ROOM STYLES · CHEAP SAVED CAT HOUSE COLOR PASSES"
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
      const previewHat = attachCatAccessory(this, cat, item.id, 64, SaveGame.hatAdjustment(level.cat.id, item.id));
      const name = this.add.text(x, y + 45, this.catDisplayName(level), textStyle(14)).setOrigin(0.5).setDepth(64);
      const hit = this.add.rectangle(x, y, 154, 116, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(65);
      hit.on("pointerup", () => {
        SaveGame.assignHat(item.id, level.cat.id, SaveGame.hatAdjustment(level.cat.id, item.id));
        this.save = SaveGame.load();
        this.registry.set("save", this.save);
        this.refresh();
        this.openCatPicker(item, safePage);
        this.toast(`${item.name} equipped to ${this.catDisplayName(level)}!`);
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

  openGrannyEditor(item) {
    this.closeCatPicker();
    this.closeGrannyEditor();
    const saved = SaveGame.gearAdjustment(item.id);
    const draft = {
      anchor: saved.anchor || item.granny.anchor || "torso",
      x: saved.x || 0,
      y: saved.y || 0,
      scale: saved.scale || 1,
      angle: saved.angle || 0
    };
    const parts = [];
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.72).setDepth(70).setInteractive();
    const panel = this.add.rectangle(640, 360, 930, 610, COLORS.cream).setDepth(71);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 90, `EDIT GRANNY · ${item.name.toUpperCase()}`, textStyle(30, "#ec5966")).setOrigin(0.5).setDepth(72);
    const hint = this.add.text(640, 130, "Drag the item · choose anchor · scale and rotate", textStyle(16, "#725f72")).setOrigin(0.5).setDepth(72);
    const grannySkin = visualItem(this.save.selectedGrannySkin);
    const granny = this.add.sprite(355, 390, grannySkin?.texture || "granny-skate", 0)
      .setScale(0.42)
      .setDepth(73)
      .play(grannySkin?.animation || "granny-skating");
    granny.baseScale = 0.42;
    const gear = createGrannyGear(this, granny, item.id, 75, draft);
    gear?.setInteractive({ useHandCursor: true });
    if (gear) this.input.setDraggable(gear);
    const anchorMarkers = this.createGrannyAnchorMarkers(granny, 74);
    const stat = this.add.text(705, 188, "", textStyle(15, "#2f2335")).setOrigin(0.5).setDepth(74);
    parts.push(shade, panel, title, hint, granny, gear, ...anchorMarkers.flatMap((entry) => [entry.dot, entry.label]), stat);
    this.grannyEditor = { item, draft, granny, gear, stat, anchorMarkers, dragStart: null, pinchStart: null };

    gear?.on("dragstart", (pointer) => {
      this.grannyEditor.dragStart = { x: pointer.x, y: pointer.y, draft: { ...this.grannyEditor.draft } };
    });
    gear?.on("drag", (pointer) => this.dragGrannyGear(pointer));
    this.editorWheelHandler = (_pointer, _objects, _dx, dy) => {
      if (!this.grannyEditor) return;
      this.scaleGrannyGear(dy < 0 ? 0.05 : -0.05);
    };
    this.input.on("wheel", this.editorWheelHandler);

    ["head", "torso", "hand"].forEach((anchor, index) => {
      const button = pill(this, 570 + index * 125, 250, 105, 48, anchor.toUpperCase(), {
        fill: draft.anchor === anchor ? COLORS.yellow : COLORS.cream,
        size: 13
      }).setDepth(74);
      button.on("pointerup", () => {
        this.grannyEditor.draft.anchor = anchor;
        this.refreshGrannyEditor();
      });
      parts.push(button);
    });
    [
      ["←", 560, 330, () => this.moveGrannyGear(-4, 0)],
      ["→", 625, 330, () => this.moveGrannyGear(4, 0)],
      ["↑", 690, 330, () => this.moveGrannyGear(0, -4)],
      ["↓", 755, 330, () => this.moveGrannyGear(0, 4)],
      ["-", 820, 330, () => this.scaleGrannyGear(-0.05)],
      ["+", 885, 330, () => this.scaleGrannyGear(0.05)],
      ["↺", 950, 330, () => this.rotateGrannyGear(-3)],
      ["↻", 1015, 330, () => this.rotateGrannyGear(3)]
    ].forEach(([label, x, y, action]) => {
      const button = pill(this, x, y, 52, 46, label, { fill: COLORS.cream, size: 20 }).setDepth(74);
      button.on("pointerup", action);
      parts.push(button);
    });
    const equip = pill(this, 610, 535, 150, 54, "EQUIP", { fill: COLORS.yellow, size: 17 }).setDepth(74);
    const reset = pill(this, 775, 535, 130, 54, "FIT", { fill: COLORS.cream, size: 15 }).setDepth(74);
    const close = pill(this, 930, 535, 130, 54, "CLOSE", { fill: COLORS.cream, size: 15 }).setDepth(74);
    equip.on("pointerup", () => {
      SaveGame.setGearAdjustment(item.id, this.grannyEditor.draft);
      SaveGame.equipGear(item.id);
      this.save = SaveGame.load();
      this.registry.set("save", this.save);
      sound(this, "buy");
      this.closeGrannyEditor();
      this.refresh();
      this.toast(`${item.name} equipped!`);
    });
    reset.on("pointerup", () => {
      this.grannyEditor.draft = { anchor: item.granny.anchor || "torso", x: 0, y: 0, scale: 1, angle: 0 };
      this.refreshGrannyEditor();
    });
    close.on("pointerup", () => this.closeGrannyEditor());
    parts.push(equip, reset, close);
    this.grannyEditorParts = parts.filter(Boolean);
    this.refreshGrannyEditor();
  }

  createGrannyAnchorMarkers(granny, depth) {
    const colors = { head: COLORS.yellow, torso: COLORS.teal, hand: COLORS.coral };
    return ["head", "torso", "hand"].map((anchorName) => {
      const anchor = GRANNY_GEAR_ANCHORS.default[anchorName];
      const x = granny.x + anchor.x * granny.scaleX;
      const y = granny.y + anchor.y * granny.scaleY;
      const dot = this.add.circle(x, y, anchorName === "head" ? 9 : 7, colors[anchorName], 0.78)
        .setStrokeStyle(2, COLORS.ink, 0.7)
        .setDepth(depth);
      const label = this.add.text(x, y + 18, anchorName.toUpperCase(), textStyle(9, "#2f2335"))
        .setOrigin(0.5)
        .setDepth(depth);
      return { anchorName, dot, label };
    });
  }

  refreshGrannyEditor() {
    const editor = this.grannyEditor;
    if (!editor) return;
    setGrannyGearAdjustment(editor.gear, editor.draft);
    syncGrannyGear(editor.gear, editor.granny);
    editor.anchorMarkers?.forEach(({ anchorName, dot }) => {
      dot.setFillStyle(anchorName === editor.draft.anchor ? COLORS.yellow : 0xffffff, anchorName === editor.draft.anchor ? 0.95 : 0.55);
      dot.setScale(anchorName === editor.draft.anchor ? 1.22 : 1);
    });
    editor.stat.setText(`ANCHOR ${editor.draft.anchor.toUpperCase()} · X ${editor.draft.x} · Y ${editor.draft.y} · SIZE ${editor.draft.scale.toFixed(2)} · ROT ${editor.draft.angle}`);
  }

  dragGrannyGear(pointer) {
    const editor = this.grannyEditor;
    if (!editor?.dragStart) return;
    editor.draft.x = Phaser.Math.Clamp(Math.round(editor.dragStart.draft.x + (pointer.x - editor.dragStart.x) / Math.abs(editor.granny.scaleX)), -260, 260);
    editor.draft.y = Phaser.Math.Clamp(Math.round(editor.dragStart.draft.y + (pointer.y - editor.dragStart.y) / Math.abs(editor.granny.scaleY)), -260, 260);
    this.refreshGrannyEditor();
  }

  moveGrannyGear(dx, dy) {
    if (!this.grannyEditor) return;
    this.grannyEditor.draft.x = Phaser.Math.Clamp(this.grannyEditor.draft.x + dx, -260, 260);
    this.grannyEditor.draft.y = Phaser.Math.Clamp(this.grannyEditor.draft.y + dy, -260, 260);
    this.refreshGrannyEditor();
  }

  scaleGrannyGear(delta) {
    if (!this.grannyEditor) return;
    this.grannyEditor.draft.scale = Phaser.Math.Clamp(Number((this.grannyEditor.draft.scale + delta).toFixed(2)), 0.25, 3);
    this.refreshGrannyEditor();
  }

  rotateGrannyGear(delta) {
    if (!this.grannyEditor) return;
    this.grannyEditor.draft.angle = Phaser.Math.Clamp(this.grannyEditor.draft.angle + delta, -120, 120);
    this.refreshGrannyEditor();
  }

  updateGrannyEditorPinch() {
    const editor = this.grannyEditor;
    if (!editor) return;
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
    if (!p1?.isDown || !p2?.isDown) {
      editor.pinchStart = null;
      return;
    }
    const distance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    if (!editor.pinchStart) {
      editor.pinchStart = { distance, scale: editor.draft.scale };
      return;
    }
    if (editor.pinchStart.distance <= 0) return;
    editor.draft.scale = Phaser.Math.Clamp(
      Number((editor.pinchStart.scale * (distance / editor.pinchStart.distance)).toFixed(2)),
      0.25,
      3
    );
    this.refreshGrannyEditor();
  }

  closeGrannyEditor() {
    if (this.editorWheelHandler) {
      this.input.off("wheel", this.editorWheelHandler);
      this.editorWheelHandler = null;
    }
    this.grannyEditorParts?.forEach((item) => item.destroy());
    this.grannyEditorParts = null;
    this.grannyEditor = null;
  }

  toast(message) {
    this.toastParts?.forEach((item) => item.destroy());
    const bg = this.add.rectangle(640, 660, 440, 55, COLORS.ink, 0.95).setDepth(230);
    bg.setStrokeStyle(3, COLORS.cream);
    const label = this.add.text(640, 661, message, textStyle(19, "#fff7df")).setOrigin(0.5).setDepth(231);
    this.toastParts = [bg, label];
    this.time.delayedCall(1500, () => {
      this.toastParts?.forEach((item) => item.destroy());
      this.toastParts = null;
    });
  }
}
