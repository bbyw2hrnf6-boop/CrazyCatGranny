import { LEVELS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { addDetailedCat } from "../objects/Cat.js";
import { addPaperTexture, COLORS, coinBadge, pill, sound, textStyle, topBar } from "../ui/ui.js";

const CAT_ITEMS = [
  ["none", "Natural Fur", "×", "#8f7d8d"],
  ["partyHat", "Party Hat", "△", "#ec5966"],
  ["crown", "Tiny Crown", "♛", "#f2b83f"],
  ["cowboy", "Meowboy Hat", "⌒", "#8c5837"],
  ["beanie", "Blue Beanie", "●", "#4b86c5"],
  ["witchHat", "Moon Witch", "▲", "#6b4a86"],
  ["vikingHat", "Tiny Viking", "♈", "#8394a0"],
  ["bowHat", "Velvet Bow", "∞", "#d9576d"],
  ["sunHat", "Sun Bonnet", "☀", "#f2c44f"]
];

const HOME_ITEMS = [
  ["scratcher", "Scratch Palace", "♜"],
  ["catbed", "Cloud Bed", "☁"],
  ["yarnbasket", "Yarn Basket", "◉"],
  ["aquarium", "Aquarium", "◈"],
  ["windowseat", "Window Throne", "▣"],
  ["catbridge", "Wall Bridge", "⌁"],
  ["velvetsofa", "Velvet Sofa", "▰"],
  ["wallpaper", "Paw Wallpaper", "⁙"]
];

export class CatHouse extends Phaser.Scene {
  constructor() {
    super("CatHouse");
  }

  init(data) {
    this.page = Phaser.Math.Clamp(data?.page || 1, 1, 5);
  }

  create() {
    this.save = SaveGame.load();
    this.roomCats = [];
    this.registry.set("save", this.save);
    this.drawRoom();
    addPaperTexture(this);
    topBar(this, "GRANNY'S CAT HOUSE", () => this.scene.start("MainMenu"));
    const badge = coinBadge(this);
    badge.setValue(this.save.coins);
    this.add.text(715, 112, `${this.save.rescuedCats.length}/45 CATS HOME`, textStyle(18, "#6d596d")).setOrigin(0);

    if (this.save.rescuedCats.length === 0) {
      this.add.text(785, 320, "So quiet… too quiet.", textStyle(30, "#725e72")).setOrigin(0.5);
      this.add.text(785, 370, "Rescue Mimi in Level 1!", textStyle(21, "#9a8297")).setOrigin(0.5);
      const go = pill(this, 785, 460, 260, 64, "START RESCUE", { fill: COLORS.yellow, size: 22 });
      go.on("pointerup", () => this.scene.start("GameScene", { levelId: 1 }));
    } else {
      this.placeCats();
      this.time.addEvent({
        delay: 8400,
        loop: true,
        callback: () => this.ambientCatMoment()
      });
    }

    this.add.text(63, 120, "CATALOGUE", textStyle(18, "#725e72")).setOrigin(0);
    this.catalogue();
    const previous = pill(this, 90, 505, 55, 45, "‹", { fill: COLORS.cream, size: 23 });
    const page = this.add.text(154, 505, `WORLD ${this.page}`, textStyle(15, "#725e72")).setOrigin(0.5);
    const next = pill(this, 235, 505, 55, 45, "›", { fill: COLORS.cream, size: 23 });
    previous.on("pointerup", () => this.scene.restart({ page: this.page === 1 ? 5 : this.page - 1 }));
    next.on("pointerup", () => this.scene.restart({ page: this.page === 5 ? 1 : this.page + 1 }));
    const room = pill(this, 845, 654, 230, 58, "✦  EDIT ROOM", { fill: COLORS.cream, size: 18 });
    room.on("pointerup", () => this.openRoomCustomizer());
    const shop = pill(this, 1100, 654, 245, 58, "🛍  OUTFIT SHOP", { fill: COLORS.yellow, size: 18 });
    shop.on("pointerup", () => this.scene.start("Shop"));
  }

  drawRoom() {
    this.add.image(640, 360, "cat-house-bg").setDisplaySize(1280, 720).setDepth(-20);
    this.add.rectangle(150, 400, 300, 640, 0xfff4dc, 0.82).setDepth(-6)
      .setStrokeStyle(4, COLORS.ink, 0.75);
    const g = this.add.graphics().setDepth(-10);
    if (this.save.activeDecor.includes("wallpaper")) {
      for (let x = 330; x < 1240; x += 74) {
        g.fillStyle(0xe58f99, 0.2).fillCircle(x, 112, 7).fillCircle(x - 9, 104, 4).fillCircle(x + 9, 104, 4);
      }
    }
    if (this.save.activeDecor.includes("velvetsofa")) {
      g.lineStyle(5, 0xf1c36a, 0.65).beginPath().arc(640, 369, 205, 0.08, 3.06).strokePath();
      for (let x = 510; x <= 770; x += 65) g.fillStyle(0xf3d58a, 0.65).fillCircle(x, 354, 3);
    }

    if (this.save.activeDecor.includes("scratcher")) {
      g.fillStyle(0x9b6846).fillRoundedRect(304, 463, 118, 15, 7).fillRoundedRect(330, 350, 88, 14, 7);
      g.fillStyle(0xd0a775).fillRect(366, 361, 16, 103);
      for (let y = 366; y < 460; y += 9) g.lineStyle(2, 0x8d623f, 0.7).beginPath().moveTo(366, y).lineTo(382, y + 4).strokePath();
      g.lineStyle(4, 0x5b4035).strokeRoundedRect(304, 463, 118, 15, 7);
    }
    if (this.save.activeDecor.includes("catbed")) {
      g.fillStyle(0x79bdc8).fillEllipse(1088, 565, 155, 50);
      g.fillStyle(0xeef9f2).fillCircle(1048, 552, 30).fillCircle(1088, 545, 39).fillCircle(1128, 553, 29);
      g.lineStyle(4, 0x4e8192, 0.8).strokeEllipse(1088, 565, 155, 50);
    }
    if (this.save.activeDecor.includes("yarnbasket")) {
      g.fillStyle(0x8f5d41).fillRoundedRect(458, 536, 118, 66, 14);
      g.lineStyle(4, 0xd2a36f).strokeRoundedRect(458, 536, 118, 66, 14);
      this.add.image(490, 530, "yarn").setScale(0.55).setDepth(-8);
      this.add.image(540, 536, "yarn").setScale(0.46).setTint(0xe0646a).setDepth(-8);
    }
    if (this.save.activeDecor.includes("aquarium")) {
      g.fillStyle(0x416e77).fillRoundedRect(1030, 154, 128, 92, 8);
      g.fillStyle(0x66c6d4, 0.88).fillRoundedRect(1037, 161, 114, 77, 5);
      g.fillStyle(0xf2b53f).fillEllipse(1088, 201, 27, 14).fillTriangle(1074, 201, 1060, 190, 1060, 212);
      g.fillStyle(0xffffff, 0.72).fillCircle(1122, 182, 4).fillCircle(1128, 171, 3);
      g.lineStyle(4, 0xe8f7ef, 0.8).strokeRoundedRect(1037, 161, 114, 77, 5);
    }
    if (this.save.activeDecor.includes("windowseat")) {
      g.fillStyle(0x4f899c, 0.86).fillRoundedRect(928, 332, 220, 30, 13);
      g.lineStyle(4, 0xe8d4ae, 0.85).strokeRoundedRect(928, 332, 220, 30, 13);
    }
    if (this.save.activeDecor.includes("catbridge")) {
      g.fillStyle(0x97603f).fillRoundedRect(690, 244, 116, 15, 7).fillRoundedRect(785, 207, 116, 15, 7);
      g.lineStyle(4, 0x5d3e34).beginPath().moveTo(690, 244).lineTo(785, 207)
        .moveTo(806, 259).lineTo(901, 222).strokePath();
      g.fillStyle(0xe2b773, 0.6).fillRect(700, 247, 96, 3).fillRect(795, 210, 96, 3);
    }
  }

  catalogue() {
    const pageLevels = LEVELS.filter((level) => level.world === this.page);
    pageLevels.forEach((level, index) => {
      const rescued = this.save.rescuedCats.includes(level.cat.id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 68 + col * 78;
      const y = 175 + row * 98;
      const card = this.add.rectangle(x, y, 64, 76, rescued ? COLORS.cream : 0xbaaeb5).setOrigin(0);
      card.setStrokeStyle(3, rescued ? COLORS.ink : 0x958792);
      if (rescued) {
        addDetailedCat(this, x + 32, y + 31, level.id - 1, 0.12);
        this.add.text(x + 32, y + 64, level.cat.name, textStyle(12)).setOrigin(0.5);
        card.setInteractive({ useHandCursor: true }).on("pointerup", () => this.showCatCard(level));
      } else {
        this.add.text(x + 32, y + 34, "?", textStyle(28, "#8e818d")).setOrigin(0.5);
        this.add.text(x + 32, y + 64, `LV ${level.id}`, textStyle(10, "#7f737e")).setOrigin(0.5);
      }
    });
  }

  placeCats() {
    const rescued = LEVELS.filter((level) => this.save.rescuedCats.includes(level.cat.id));
    const scale = rescued.length > 32 ? 0.105 : rescued.length > 18 ? 0.125 : rescued.length > 9 ? 0.15 : 0.19;
    rescued.forEach((level, order) => {
      const random = new Phaser.Math.RandomDataGenerator([`cat-${level.id}`]);
      const x = random.between(380, 1210);
      const y = random.between(300, 615);
      const cat = addDetailedCat(this, x, y, level.id - 1, scale)
        .setInteractive({ useHandCursor: true })
        .setDepth(10 + Math.floor(y / 12));
      if (order % 2) cat.setFlipX(true);
      const hat = this.addHat(cat, SaveGame.hatForCat(level.cat.id));
      const agent = {
        sprite: cat,
        hat,
        level,
        x,
        y,
        targetX: x,
        targetY: y,
        speed: random.between(52, 78),
        phase: random.realInRange(0, Math.PI * 2),
        baseScale: scale,
        state: "idle",
        nextChange: this.time.now + random.between(500, 2600),
        bubble: null,
        bubbleUntil: 0,
        lastPaw: 0,
        nextTwitch: this.time.now + random.between(1200, 4200)
      };
      this.roomCats.push(agent);
      cat.on("pointerover", () => this.tweens.add({ targets: cat, scale: scale * 1.08, duration: 100 }));
      cat.on("pointerout", () => this.tweens.add({ targets: cat, scale: scale, duration: 100 }));
      cat.on("pointerup", () => {
        sound(this, "purr");
        SaveGame.selectCat(level.cat.id);
        this.showCatCard(level);
      });
    });
  }

  update(time, delta) {
    if (!this.roomCats?.length) return;
    const step = Math.min(delta / 1000, 0.04);
    this.roomCats.forEach((agent, index) => {
      if (time >= agent.nextChange) this.chooseCatBehavior(agent, time, index);
      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const distance = Math.hypot(dx, dy);
      const moving = distance > 8 && (agent.state === "wander" || agent.state.startsWith("travel-"));
      if (moving) {
        agent.x += (dx / distance) * agent.speed * step;
        agent.y += (dy / distance) * agent.speed * step;
        agent.sprite.setFlipX(dx < 0);
        const gait = Math.sin(time * 0.009 + agent.phase);
        agent.sprite.setPosition(agent.x, agent.y - Math.abs(gait) * 2.3);
        agent.sprite.setScale(agent.baseScale * (1 + gait * 0.012), agent.baseScale * (1 - gait * 0.02));
        agent.sprite.setAngle(gait * 1.1);
        if (Math.abs(gait) > 0.92 && time - agent.lastPaw > 260) {
          agent.lastPaw = time;
          const paw = this.add.ellipse(agent.x, agent.y + 25, 10, 4, 0x6d5365, 0.18).setDepth(7);
          this.tweens.add({ targets: paw, alpha: 0, duration: 500, onComplete: () => paw.destroy() });
        }
      } else {
        if (distance <= 8 && agent.state.startsWith("travel-")) this.beginCatAction(agent, time);
        this.animateCatAction(agent, time);
      }
      if (time >= agent.nextTwitch && agent.state !== "sleep") {
        agent.nextTwitch = time + Phaser.Math.Between(2200, 6200);
        this.tweens.add({
          targets: agent.sprite,
          angle: agent.sprite.angle + (Math.random() > 0.5 ? 2.2 : -2.2),
          duration: 90,
          yoyo: true,
          ease: "Sine.inOut"
        });
      }
      agent.sprite.setDepth(10 + Math.floor(agent.y / 12));
      if (agent.hat) {
        agent.hat.setPosition(agent.sprite.x, agent.sprite.y - 178 * agent.baseScale);
        agent.hat.setDepth(agent.sprite.depth + 1);
      }
      if (agent.bubble) {
        if (agent.bubbleUntil && time > agent.bubbleUntil) this.clearCatBubble(agent);
      }
      if (agent.bubble) {
        agent.bubble.setPosition(agent.sprite.x + 18, agent.sprite.y - 45);
        agent.bubble.setDepth(agent.sprite.depth + 2);
      }
    });
  }

  chooseCatBehavior(agent, time, index) {
    let roll = Phaser.Math.Between(0, 99);
    const doing = (activity) => this.roomCats.filter((cat) => (
      cat.state === activity || cat.state === `travel-${activity}`
    )).length;
    if (roll >= 36 && roll < 52 && doing("eat") >= 3) roll = 0;
    if (roll >= 52 && roll < 64 && doing("drink") >= 2) roll = 0;
    if (roll >= 64 && roll < 79 && doing("play") >= 4) roll = 0;
    if (roll >= 90 && doing("sleep") >= 5) roll = 0;
    this.clearCatBubble(agent);
    if (roll < 36) {
      agent.state = "wander";
      agent.targetX = Phaser.Math.Clamp(agent.x + Phaser.Math.Between(-320, 320), 355, 1215);
      agent.targetY = Phaser.Math.Clamp(agent.y + Phaser.Math.Between(-170, 170), 330, 620);
      agent.nextChange = time + Phaser.Math.Between(6500, 10500);
    } else if (roll < 52) {
      agent.state = "travel-eat";
      const foodSlot = doing("eat");
      agent.targetX = 1148 + foodSlot * 34;
      agent.targetY = 574 + (foodSlot % 2) * 28;
      agent.nextChange = time + 18000;
    } else if (roll < 64) {
      agent.state = "travel-drink";
      const waterSlot = doing("drink");
      agent.targetX = 1092 + waterSlot * 46;
      agent.targetY = 586 + waterSlot * 20;
      agent.nextChange = time + 18000;
    } else if (roll < 79) {
      agent.state = "travel-play";
      agent.targetX = this.save.activeDecor.includes("yarnbasket") ? 520 : Phaser.Math.Between(600, 900);
      agent.targetY = this.save.activeDecor.includes("yarnbasket") ? 545 : 600;
      agent.nextChange = time + 18000;
    } else if (roll < 90 && this.roomCats.length > 1) {
      const friend = this.roomCats[(index + Phaser.Math.Between(1, this.roomCats.length - 1)) % this.roomCats.length];
      agent.state = "travel-social";
      agent.targetX = friend.x + Phaser.Math.Between(-35, 35);
      agent.targetY = friend.y;
      agent.nextChange = time + 15000;
    } else {
      agent.state = "travel-sleep";
      const sleepSpots = [
        [720, 450],
        [900, 450],
        [790, 505]
      ];
      if (this.save.activeDecor.includes("catbed")) sleepSpots.push([1065, 550], [1120, 550]);
      if (this.save.activeDecor.includes("windowseat")) sleepSpots.push([970, 350]);
      if (this.save.activeDecor.includes("catbridge")) sleepSpots.push([750, 270], [845, 225]);
      const spot = sleepSpots[(agent.level.id + doing("sleep")) % sleepSpots.length];
      [agent.targetX, agent.targetY] = spot;
      agent.nextChange = time + 22000;
    }
    if (Math.random() > 0.95) this.catSpeaks(agent, "meow!", "meow", 1200);
  }

  beginCatAction(agent, time) {
    agent.x = agent.targetX;
    agent.y = agent.targetY;
    agent.state = agent.state.replace("travel-", "");
    const durations = {
      eat: Phaser.Math.Between(4200, 7000),
      drink: Phaser.Math.Between(3200, 5600),
      play: Phaser.Math.Between(4000, 6800),
      social: Phaser.Math.Between(3200, 6000),
      sleep: Phaser.Math.Between(9000, 16000)
    };
    const duration = durations[agent.state] || 3500;
    agent.nextChange = time + duration;
    if (agent.state === "eat" && Math.random() > 0.55) this.catSpeaks(agent, "yum", "purr", 1500);
    if (agent.state === "drink" && Math.random() > 0.68) this.catSpeaks(agent, "sip", null, 1300);
    if (agent.state === "play" && Math.random() > 0.45) this.catSpeaks(agent, "♪", "meow", 1400);
    if (agent.state === "social" && Math.random() > 0.5) this.catSpeaks(agent, "prrr", "purr", 1500);
    if (agent.state === "sleep") this.catSpeaks(agent, "Z z z", "purr", duration);
  }

  animateCatAction(agent, time) {
    const breath = Math.sin(time * 0.0032 + agent.phase);
    let x = agent.x;
    let y = agent.y - breath * 1.2;
    let scaleX = agent.baseScale;
    let scaleY = agent.baseScale * (1 + breath * 0.014);
    let angle = 0;

    if (agent.state === "sleep") {
      y = agent.y + 7 - Math.abs(breath) * 0.5;
      scaleX = agent.baseScale * 1.12;
      scaleY = agent.baseScale * (0.72 + breath * 0.012);
      angle = agent.sprite.flipX ? -4 : 4;
      if (agent.bubble) agent.bubble.setAlpha(0.58 + Math.sin(time * 0.002) * 0.25);
    } else if (agent.state === "eat" || agent.state === "drink") {
      const dip = (Math.sin(time * 0.0055 + agent.phase) + 1) / 2;
      y = agent.y + dip * 5;
      angle = agent.sprite.flipX ? dip * 2.5 : -dip * 2.5;
      scaleY *= 1 - dip * 0.025;
    } else if (agent.state === "play") {
      const pounce = Math.max(0, Math.sin(time * 0.0065 + agent.phase));
      y = agent.y - pounce * 8;
      x = agent.x + Math.sin(time * 0.004 + agent.phase) * 5;
      angle = Math.sin(time * 0.0065 + agent.phase) * 3;
    } else if (agent.state === "social") {
      x = agent.x + Math.sin(time * 0.0028 + agent.phase) * 3;
      angle = Math.sin(time * 0.003 + agent.phase) * 1.4;
    }

    agent.sprite.setPosition(x, y);
    agent.sprite.setScale(scaleX, scaleY);
    agent.sprite.setAngle(angle);
  }

  catSpeaks(agent, label, kind, duration = 1400) {
    this.clearCatBubble(agent);
    agent.bubble = this.add.text(
      agent.x,
      agent.y,
      label,
      textStyle(label.startsWith("Z") ? 12 : 11, "#76508a")
    ).setOrigin(0.5);
    agent.bubbleUntil = this.time.now + duration;
    if (kind) sound(this, kind);
  }

  clearCatBubble(agent) {
    agent.bubble?.destroy();
    agent.bubble = null;
    agent.bubbleUntil = 0;
  }

  ambientCatMoment() {
    const awake = this.roomCats.filter((agent) => agent.state !== "sleep");
    if (!awake.length) return;
    const agent = Phaser.Utils.Array.GetRandom(awake);
    this.catSpeaks(
      agent,
      Math.random() > 0.28 ? "meow!" : "mrrp",
      Math.random() > 0.35 ? "meow" : "purr",
      1500
    );
  }

  addHat(cat, hat) {
    if (hat === "none") return null;
    const icons = { partyHat: "△", crown: "♛", cowboy: "⌒", beanie: "●", witchHat: "▲", vikingHat: "♈", bowHat: "∞", sunHat: "☀" };
    const colors = { partyHat: "#ec5966", crown: "#f2b83f", cowboy: "#8c5837", beanie: "#4b86c5", witchHat: "#6b4a86", vikingHat: "#8394a0", bowHat: "#d9576d", sunHat: "#f2c44f" };
    const label = this.add.text(cat.x, cat.y - 178 * cat.scaleY, icons[hat] || "△", textStyle(108 * cat.scaleY, colors[hat] || "#ec5966"))
      .setOrigin(0.5);
    return label;
  }

  showCatCard(level) {
    this.card?.forEach((item) => item.destroy());
    const shade = this.add.rectangle(790, 370, 650, 460, COLORS.ink, 0.95).setDepth(70);
    shade.setStrokeStyle(6, COLORS.cream);
    const portrait = addDetailedCat(this, 625, 350, level.id - 1, 0.35).setDepth(71);
    const title = this.add.text(865, 235, level.cat.name.toUpperCase(), textStyle(35, "#ffcc4d")).setOrigin(0.5).setDepth(71);
    const rarity = this.add.text(865, 280, level.cat.rarity, textStyle(17, "#cabacf")).setOrigin(0.5).setDepth(71);
    const trait = this.add.text(865, 340, `“${level.cat.trait}”`, textStyle(20, "#fff7df", { wordWrap: { width: 300 }, align: "center" })).setOrigin(0.5).setDepth(71);
    const rescue = this.add.text(865, 400, `Rescued in Level ${level.id}`, textStyle(16, "#d9c9d8")).setOrigin(0.5).setDepth(71);
    const hat = SaveGame.hatForCat(level.cat.id);
    const outfit = this.add.text(865, 435, hat === "none" ? "Outfit: natural fur" : `Outfit: ${hat}`, textStyle(15, "#d9c9d8")).setOrigin(0.5).setDepth(71);
    const customize = pill(this, 785, 535, 235, 58, "✦  CUSTOMIZE", { fill: COLORS.yellow, size: 19 }).setDepth(72);
    const close = pill(this, 1035, 535, 150, 58, "CLOSE", { fill: COLORS.cream, size: 18 }).setDepth(72);
    this.card = [shade, portrait, title, rarity, trait, rescue, outfit, customize, close];
    customize.on("pointerup", () => this.openCatCustomizer(level));
    close.on("pointerup", () => {
      this.card.forEach((item) => item.destroy());
      this.card = null;
    });
  }

  openCatCustomizer(level) {
    this.card?.forEach((item) => item.destroy());
    this.card = null;
    this.closeOverlay();
    const parts = [];
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(80).setInteractive();
    const panel = this.add.rectangle(640, 360, 920, 610, COLORS.cream).setDepth(81);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 88, `CUSTOMIZE ${level.cat.name.toUpperCase()}`, textStyle(31, "#ec5966")).setOrigin(0.5).setDepth(82);
    const portrait = addDetailedCat(this, 330, 335, level.id - 1, 0.42).setDepth(82);
    parts.push(shade, panel, title, portrait);
    const current = SaveGame.hatForCat(level.cat.id);
    CAT_ITEMS.forEach(([id, name, icon, color], index) => {
      const owned = id === "none" || this.save.owned.includes(id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 585 + col * 170;
      const y = 205 + row * 135;
      const card = this.add.rectangle(x, y, 145, 105, current === id ? COLORS.yellow : owned ? 0xffffff : 0xb9afb7).setDepth(82);
      card.setStrokeStyle(4, current === id ? COLORS.coral : COLORS.ink);
      const symbol = this.add.text(x, y - 17, owned ? icon : "🔒", textStyle(31, color)).setOrigin(0.5).setDepth(83);
      const label = this.add.text(x, y + 27, name, textStyle(13, owned ? "#2f2335" : "#7d717c")).setOrigin(0.5).setDepth(83);
      parts.push(card, symbol, label);
      if (owned) {
        const hit = this.add.rectangle(x, y, 145, 105, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(84);
        hit.on("pointerup", () => {
          if (id === "none") SaveGame.clearCatHat(level.cat.id);
          else SaveGame.assignHat(id, level.cat.id);
          sound(this, "buy");
          this.scene.restart({ page: level.world });
        });
        parts.push(hit);
      }
    });
    const close = pill(this, 1040, 630, 145, 48, "CLOSE", { fill: COLORS.yellow, size: 16 }).setDepth(84);
    close.on("pointerup", () => this.closeOverlay());
    parts.push(close);
    this.overlayParts = parts;
  }

  openRoomCustomizer() {
    this.closeOverlay();
    const parts = [];
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(80).setInteractive();
    const panel = this.add.rectangle(640, 360, 960, 610, COLORS.cream).setDepth(81);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 90, "DESIGN THE CAT HOUSE", textStyle(32, "#ec5966")).setOrigin(0.5).setDepth(82);
    const sub = this.add.text(640, 128, "Tap owned furniture to place or store it", textStyle(16, "#725f72")).setOrigin(0.5).setDepth(82);
    parts.push(shade, panel, title, sub);
    HOME_ITEMS.forEach(([id, name, icon], index) => {
      const owned = this.save.owned.includes(id);
      const active = this.save.activeDecor.includes(id);
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 295 + col * 230;
      const y = 275 + row * 190;
      const card = this.add.rectangle(x, y, 195, 155, active ? 0xd9f2dc : owned ? 0xffffff : 0xb9afb7).setDepth(82);
      card.setStrokeStyle(5, active ? COLORS.teal : COLORS.ink);
      const symbol = this.add.text(x, y - 25, owned ? icon : "🔒", textStyle(38, owned ? "#805d72" : "#7d717c")).setOrigin(0.5).setDepth(83);
      const label = this.add.text(x, y + 22, name, textStyle(15)).setOrigin(0.5).setDepth(83);
      const status = this.add.text(x, y + 52, owned ? (active ? "PLACED" : "IN STORAGE") : "BUY IN SHOP", textStyle(11, active ? "#3f9f7c" : "#857884")).setOrigin(0.5).setDepth(83);
      parts.push(card, symbol, label, status);
      if (owned) {
        const hit = this.add.rectangle(x, y, 195, 155, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(84);
        hit.on("pointerup", () => {
          SaveGame.toggleDecor(id);
          sound(this, "buy");
          this.scene.restart({ page: this.page });
        });
        parts.push(hit);
      }
    });
    const close = pill(this, 1050, 630, 145, 48, "CLOSE", { fill: COLORS.yellow, size: 16 }).setDepth(84);
    close.on("pointerup", () => this.closeOverlay());
    parts.push(close);
    this.overlayParts = parts;
  }

  closeOverlay() {
    this.overlayParts?.forEach((item) => item.destroy());
    this.overlayParts = null;
  }
}
