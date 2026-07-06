import { LEVELS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { HAT_ITEMS, HOME_ITEMS, roomPosition } from "../visual/VisualCatalog.js";
import {
  attachCatAccessory,
  createCat,
  createItemPreview,
  createRoomDecor,
  syncCatAccessory
} from "../visual/VisualFactory.js";
import { addPaperTexture, COLORS, coinBadge, pill, sound, textStyle, topBar } from "../ui/ui.js";

const NATURAL_FUR = { id: "none", name: "Natural Fur", icon: "×", color: "#8f7d8d" };

export class CatHouse extends Phaser.Scene {
  constructor() {
    super("CatHouse");
  }

  init(data) {
    this.page = Phaser.Math.Clamp(data?.page || 1, 1, 5);
    this.roomEditing = false;
    this.selectedFurnitureId = null;
    this.draftDecorPositions = null;
    this.editorLabels = null;
    this.editorParts = null;
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
    this.roomActionButtons = [room, shop];
  }

  drawRoom() {
    this.add.image(640, 360, "cat-house-bg").setDisplaySize(1280, 720).setDepth(-20);
    this.add.rectangle(150, 400, 300, 640, 0xfff4dc, 0.82).setDepth(-6)
      .setStrokeStyle(4, COLORS.ink, 0.75);
    const room = createRoomDecor(this, this.save.activeDecor, this.save.decorPositions);
    this.roomFurniture = room.furniture;
    this.catPerches = room.perches;
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
        createCat(this, x + 32, y + 31, level.id - 1, 0.12);
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
    const clockNow = this.game.loop.time || this.time.now;
    rescued.forEach((level, order) => {
      const random = new Phaser.Math.RandomDataGenerator([`cat-${level.id}`]);
      const x = random.between(380, 1210);
      const y = random.between(515, 610);
      const cat = createCat(this, x, y, level.id - 1, scale)
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
        speed: random.between(30, 50),
        phase: random.realInRange(0, Math.PI * 2),
        baseScale: scale,
        state: "idle",
        nextChange: clockNow + random.between(4000, 14000),
        path: [],
        moveMode: "walk",
        jump: null,
        destinationPerchId: null,
        destinationFurniture: null,
        bubble: null,
        bubbleUntil: 0,
        lastPaw: 0,
        nextTwitch: clockNow + random.between(3000, 7200)
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

  update(_time, delta) {
    if (!this.roomCats?.length) return;
    const time = this.time.now;
    const step = Math.min(delta / 1000, 0.04);
    this.roomCats.forEach((agent, index) => {
      if (this.roomEditing) {
        this.animateCatAction(agent, time);
      } else {
        if (time >= agent.nextChange && !agent.jump) {
          if (agent.y < 500) this.sendCatToFloor(agent, time);
          else this.chooseCatBehavior(agent, time, index);
        }
        if (agent.jump) this.updateCatJump(agent, time);
        else this.updateCatWalk(agent, time, step);
      }
      if (!this.roomEditing && !agent.jump && time >= agent.nextTwitch && agent.state !== "sleep") {
        agent.nextTwitch = time + Phaser.Math.Between(2200, 6200);
        this.tweens.add({
          targets: agent.sprite,
          angle: agent.sprite.angle + (Math.random() > 0.5 ? 2.2 : -2.2),
          duration: 90,
          yoyo: true,
          ease: "Sine.inOut"
        });
      }
      agent.sprite.setDepth(10 + Math.floor(agent.sprite.y / 12));
      if (agent.hat) this.syncCatHat(agent);
      if (agent.bubble) {
        if (agent.bubbleUntil && time > agent.bubbleUntil) this.clearCatBubble(agent);
      }
      if (agent.bubble) {
        agent.bubble.setPosition(agent.sprite.x + 18, agent.sprite.y - 45);
        agent.bubble.setDepth(agent.sprite.depth + 2);
      }
    });
  }

  updateCatWalk(agent, time, step) {
    let dx = agent.targetX - agent.x;
    let dy = agent.targetY - agent.y;
    let distance = Math.hypot(dx, dy);
    if (distance <= 7) {
      agent.x = agent.targetX;
      agent.y = agent.targetY;
      if (agent.path.length) {
        this.startCatWaypoint(agent, agent.path.shift(), time);
        dx = agent.targetX - agent.x;
        dy = agent.targetY - agent.y;
        distance = Math.hypot(dx, dy);
      } else if (agent.state.startsWith("travel-")) {
        this.beginCatAction(agent, time);
        this.animateCatAction(agent, time);
        return;
      }
    }

    const moving = distance > 7 && (agent.state === "wander" || agent.state.startsWith("travel-"));
    if (!moving) {
      this.animateCatAction(agent, time);
      return;
    }

    agent.x += (dx / distance) * agent.speed * step;
    agent.y += (dy / distance) * agent.speed * step;
    agent.sprite.setFlipX(dx < 0);
    const gait = Math.sin(time * 0.0062 + agent.phase);
    agent.sprite.setPosition(agent.x, agent.y - Math.abs(gait) * 1.5);
    agent.sprite.setScale(agent.baseScale * (1 + gait * 0.008), agent.baseScale * (1 - gait * 0.014));
    agent.sprite.setAngle(gait * 0.65);
    if (Math.abs(gait) > 0.94 && time - agent.lastPaw > 420) {
      agent.lastPaw = time;
      const paw = this.add.ellipse(agent.x, agent.y + 25, 9, 4, 0x6d5365, 0.14).setDepth(7);
      this.tweens.add({ targets: paw, alpha: 0, duration: 650, onComplete: () => paw.destroy() });
    }
  }

  startCatPath(agent, path, time) {
    agent.path = path.map((point, index) => Array.isArray(point)
      ? { x: point[0], y: point[1], mode: index === 0 ? "walk" : "jump" }
      : { ...point });
    if (agent.path.length) this.startCatWaypoint(agent, agent.path.shift(), time);
  }

  sendCatToFloor(agent, time) {
    const perch = this.catPerches.find((entry) => entry.id === agent.destinationPerchId);
    agent.state = "travel-idle";
    agent.destinationPerchId = null;
    agent.destinationFurniture = null;
    const exitPath = perch
      ? perch.path.slice(0, -1).reverse().map((point) => ({ ...point, mode: "jump" }))
      : [{ x: agent.x, y: 545, mode: "jump" }];
    this.startCatPath(agent, exitPath, time);
    agent.nextChange = time + 45000;
  }

  startCatWaypoint(agent, waypoint, time) {
    agent.targetX = waypoint.x;
    agent.targetY = waypoint.y;
    agent.moveMode = waypoint.mode || "walk";
    if (agent.moveMode !== "jump") return;
    const distance = Phaser.Math.Distance.Between(agent.x, agent.y, waypoint.x, waypoint.y);
    agent.jump = {
      fromX: agent.x,
      fromY: agent.y,
      toX: waypoint.x,
      toY: waypoint.y,
      startedAt: time,
      duration: Phaser.Math.Clamp(distance * 4.2, 440, 920),
      height: Phaser.Math.Clamp(28 + Math.abs(waypoint.y - agent.y) * 0.22, 30, 82)
    };
  }

  updateCatJump(agent, time) {
    const jump = agent.jump;
    const progress = Phaser.Math.Clamp((time - jump.startedAt) / jump.duration, 0, 1);
    const direction = Math.sign(jump.toX - jump.fromX) || 1;
    agent.x = Phaser.Math.Linear(jump.fromX, jump.toX, progress);
    agent.y = Phaser.Math.Linear(jump.fromY, jump.toY, progress);
    const lift = Math.sin(progress * Math.PI) * jump.height;
    agent.sprite.setFlipX(direction < 0);
    agent.sprite.setPosition(agent.x, agent.y - lift);
    agent.sprite.setScale(
      agent.baseScale * (1 - Math.sin(progress * Math.PI) * 0.035),
      agent.baseScale * (1 + Math.sin(progress * Math.PI) * 0.055)
    );
    agent.sprite.setAngle(direction * Math.sin(progress * Math.PI) * -3.5);
    if (progress < 1) return;

    agent.x = jump.toX;
    agent.y = jump.toY;
    agent.jump = null;
    agent.sprite.setPosition(agent.x, agent.y).setScale(agent.baseScale).setAngle(0);
    if (agent.path.length) this.startCatWaypoint(agent, agent.path.shift(), time);
    else if (agent.state.startsWith("travel-")) this.beginCatAction(agent, time);
  }

  chooseCatBehavior(agent, time, index) {
    let roll = Phaser.Math.Between(0, 99);
    const doing = (activity) => this.roomCats.filter((cat) => (
      cat.state === activity || cat.state === `travel-${activity}`
    )).length;
    if (roll >= 52 && roll < 61 && doing("eat") >= 3) roll = 0;
    if (roll >= 61 && roll < 68 && doing("drink") >= 2) roll = 0;
    if (roll >= 68 && roll < 76 && doing("play") >= 3) roll = 0;
    if (roll >= 87 && doing("sleep") >= Math.max(6, Math.ceil(this.roomCats.length * 0.36))) roll = 0;
    if (roll >= 42 && roll < 52 && (!this.catPerches.length || doing("perch") >= Math.min(3, this.catPerches.length))) roll = 0;
    this.clearCatBubble(agent);
    agent.path = [];
    agent.jump = null;
    agent.destinationPerchId = null;
    agent.destinationFurniture = null;

    if (roll < 30) {
      agent.state = "idle";
      agent.targetX = agent.x;
      agent.targetY = agent.y;
      agent.nextChange = time + Phaser.Math.Between(12000, 28000);
    } else if (roll < 42) {
      agent.state = "wander";
      agent.targetX = Phaser.Math.Clamp(agent.x + Phaser.Math.Between(-170, 170), 350, 1210);
      agent.targetY = Phaser.Math.Clamp(agent.y + Phaser.Math.Between(-38, 38), 520, 610);
      agent.nextChange = time + Phaser.Math.Between(9000, 16000);
    } else if (roll < 52 && this.catPerches.length) {
      const occupied = new Set(this.roomCats.map((cat) => cat.destinationPerchId).filter(Boolean));
      const available = this.catPerches.filter((perch) => !occupied.has(perch.id));
      const options = available.length ? available : this.catPerches;
      const perch = options[(agent.level.id + doing("perch")) % options.length];
      agent.state = "travel-perch";
      agent.destinationPerchId = perch.id;
      agent.destinationFurniture = perch.furniture;
      this.startCatPath(agent, perch.path, time);
      agent.nextChange = time + 60000;
    } else if (roll < 61) {
      agent.state = "travel-eat";
      const foodSlot = doing("eat");
      agent.targetX = 1148 + foodSlot * 34;
      agent.targetY = 574 + (foodSlot % 2) * 28;
      agent.nextChange = time + 45000;
    } else if (roll < 68) {
      agent.state = "travel-drink";
      const waterSlot = doing("drink");
      agent.targetX = 1092 + waterSlot * 46;
      agent.targetY = 586 + waterSlot * 20;
      agent.nextChange = time + 45000;
    } else if (roll < 76) {
      agent.state = "travel-play";
      const yarn = this.roomFurniture.yarnbasket;
      agent.targetX = yarn ? yarn.x : Phaser.Math.Between(600, 900);
      agent.targetY = yarn ? Phaser.Math.Clamp(yarn.y - 22, 525, 600) : 585;
      agent.destinationFurniture = yarn ? "yarnbasket" : null;
      agent.nextChange = time + 45000;
    } else if (roll < 82 && this.roomFurniture.aquarium) {
      agent.state = "travel-watch";
      agent.targetX = Phaser.Math.Clamp(this.roomFurniture.aquarium.x - 42, 350, 1210);
      agent.targetY = 540;
      agent.destinationFurniture = "aquarium";
      agent.nextChange = time + 45000;
    } else if (roll < 87 && this.roomCats.length > 1) {
      const floorFriends = this.roomCats.filter((cat) => cat !== agent && cat.y >= 490);
      const friend = floorFriends.length
        ? Phaser.Utils.Array.GetRandom(floorFriends)
        : this.roomCats[(index + 1) % this.roomCats.length];
      agent.state = "travel-social";
      agent.targetX = friend.x + Phaser.Math.Between(-35, 35);
      agent.targetY = Phaser.Math.Clamp(friend.y, 520, 610);
      agent.nextChange = time + 40000;
    } else {
      agent.state = "travel-sleep";
      const sleepingPerches = this.catPerches.filter((perch) => ["catbed", "windowseat", "velvetsofa"].includes(perch.furniture));
      const occupied = new Set(this.roomCats.map((cat) => cat.destinationPerchId).filter(Boolean));
      const availableBeds = sleepingPerches.filter((perch) => !occupied.has(perch.id));
      if (availableBeds.length) {
        const perch = availableBeds[(agent.level.id + doing("sleep")) % availableBeds.length];
        agent.destinationPerchId = perch.id;
        agent.destinationFurniture = perch.furniture;
        this.startCatPath(agent, perch.path, time);
      } else {
        agent.targetX = Phaser.Math.Between(570, 980);
        agent.targetY = Phaser.Math.Between(545, 605);
      }
      agent.nextChange = time + 70000;
    }
    if (Math.random() > 0.985) this.catSpeaks(agent, "meow!", "meow", 1200);
  }

  beginCatAction(agent, time) {
    agent.x = agent.targetX;
    agent.y = agent.targetY;
    agent.state = agent.state.replace("travel-", "");
    if (agent.state === "idle") {
      agent.destinationPerchId = null;
      agent.destinationFurniture = null;
    }
    const durations = {
      eat: Phaser.Math.Between(8000, 14000),
      drink: Phaser.Math.Between(6500, 11000),
      play: Phaser.Math.Between(7000, 12000),
      social: Phaser.Math.Between(6500, 12000),
      watch: Phaser.Math.Between(12000, 22000),
      perch: Phaser.Math.Between(14000, 28000),
      sleep: Phaser.Math.Between(28000, 60000)
    };
    const duration = durations[agent.state] || Phaser.Math.Between(10000, 22000);
    agent.nextChange = time + duration;
    if (agent.state === "eat" && Math.random() > 0.55) this.catSpeaks(agent, "yum", "purr", 1500);
    if (agent.state === "drink" && Math.random() > 0.68) this.catSpeaks(agent, "sip", null, 1300);
    if (agent.state === "play" && Math.random() > 0.45) this.catSpeaks(agent, "♪", "meow", 1400);
    if (agent.state === "social" && Math.random() > 0.5) this.catSpeaks(agent, "prrr", "purr", 1500);
    if (agent.state === "watch" && Math.random() > 0.5) this.catSpeaks(agent, "🐟", "purr", 1700);
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
    return attachCatAccessory(this, cat, hat);
  }

  syncCatHat(agent) {
    syncCatAccessory(agent.sprite, agent.hat);
  }

  showCatCard(level) {
    this.card?.forEach((item) => item.destroy());
    const shade = this.add.rectangle(790, 370, 650, 460, COLORS.ink, 0.95).setDepth(70);
    shade.setStrokeStyle(6, COLORS.cream);
    const portrait = createCat(this, 625, 350, level.id - 1, 0.35).setDepth(71);
    const currentHat = SaveGame.hatForCat(level.cat.id);
    const portraitHat = this.addHat(portrait, currentHat);
    if (portraitHat) this.syncCatHat({ sprite: portrait, hat: portraitHat });
    const title = this.add.text(865, 235, level.cat.name.toUpperCase(), textStyle(35, "#ffcc4d")).setOrigin(0.5).setDepth(71);
    const rarity = this.add.text(
      865,
      280,
      `${level.cat.rarity}${level.cat.limited ? " · LIMITED" : ""}`,
      textStyle(17, level.cat.limited ? "#d69cff" : "#cabacf")
    ).setOrigin(0.5).setDepth(71);
    const trait = this.add.text(865, 340, `“${level.cat.trait}”`, textStyle(20, "#fff7df", { wordWrap: { width: 300 }, align: "center" })).setOrigin(0.5).setDepth(71);
    const drop = this.save.dropHistory.find((entry) => entry.catId === level.cat.id);
    const rescueSource = drop?.type === "catbox" ? "Surprise CatBox pull" : `Three-level rescue · Level ${drop?.levelId || level.id}`;
    const rescue = this.add.text(865, 400, rescueSource, textStyle(16, "#d9c9d8")).setOrigin(0.5).setDepth(71);
    const outfit = this.add.text(865, 435, currentHat === "none" ? "Outfit: natural fur" : `Outfit: ${currentHat}`, textStyle(15, "#d9c9d8")).setOrigin(0.5).setDepth(71);
    const customize = pill(this, 785, 535, 235, 58, "✦  CUSTOMIZE", { fill: COLORS.yellow, size: 19 }).setDepth(72);
    const close = pill(this, 1035, 535, 150, 58, "CLOSE", { fill: COLORS.cream, size: 18 }).setDepth(72);
    this.card = [shade, portrait, portraitHat, title, rarity, trait, rescue, outfit, customize, close].filter(Boolean);
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
    const portrait = createCat(this, 330, 335, level.id - 1, 0.42).setDepth(82);
    parts.push(shade, panel, title, portrait);
    const current = SaveGame.hatForCat(level.cat.id);
    const portraitHat = this.addHat(portrait, current);
    if (portraitHat) {
      this.syncCatHat({ sprite: portrait, hat: portraitHat });
      portraitHat.setDepth(83);
      parts.push(portraitHat);
    }
    [NATURAL_FUR, ...HAT_ITEMS].forEach(({ id, name, icon, color }, index) => {
      const owned = id === "none" || this.save.owned.includes(id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 585 + col * 170;
      const y = 205 + row * 135;
      const card = this.add.rectangle(x, y, 145, 105, current === id ? COLORS.yellow : owned ? 0xffffff : 0xb9afb7).setDepth(82);
      card.setStrokeStyle(4, current === id ? COLORS.coral : COLORS.ink);
      const symbol = owned && id !== "none"
        ? createItemPreview(this, id, x, y - 20, { scale: 0.62, depth: 83 })
        : this.add.text(x, y - 17, owned ? icon : "🔒", textStyle(31, color)).setOrigin(0.5).setDepth(83);
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
    this.roomEditing = true;
    this.roomActionButtons?.forEach((button) => button.setVisible(false));
    this.roomCats.forEach((agent) => {
      this.clearCatBubble(agent);
      agent.path = [];
      agent.jump = null;
      agent.destinationPerchId = null;
      agent.destinationFurniture = null;
      agent.x = Phaser.Math.Clamp(agent.x, 350, 1210);
      agent.y = Phaser.Math.Clamp(Math.max(agent.y, 545), 545, 610);
      agent.targetX = agent.x;
      agent.targetY = agent.y;
      agent.state = "idle";
      agent.nextChange = Number.POSITIVE_INFINITY;
      agent.sprite.setPosition(agent.x, agent.y).setScale(agent.baseScale).setAngle(0);
    });

    this.draftDecorPositions = Object.fromEntries(
      Object.keys(this.roomFurniture).map((id) => [id, roomPosition(id, this.save.decorPositions[id])])
    );
    this.editorLabels = {};
    const parts = [];
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.001).setDepth(69).setInteractive();
    const banner = this.add.rectangle(790, 116, 720, 64, COLORS.ink, 0.94).setDepth(74);
    banner.setStrokeStyle(4, COLORS.cream);
    const title = this.add.text(790, 103, "DRAG · TURN · FLIP · RESIZE", textStyle(21, "#ffdc61")).setOrigin(0.5).setDepth(75);
    this.editorHint = this.add.text(790, 130, "Select furniture · Done saves layout and rebuilds cat paths", textStyle(13, "#fff7df")).setOrigin(0.5).setDepth(75);
    const storage = pill(this, 355, 658, 105, 52, "STORE", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const turnLeft = pill(this, 465, 658, 105, 52, "TURN ◀", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const turnRight = pill(this, 575, 658, 105, 52, "TURN ▶", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const flip = pill(this, 680, 658, 95, 52, "FLIP", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const sizeDown = pill(this, 780, 658, 95, 52, "SIZE −", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const sizeUp = pill(this, 880, 658, 95, 52, "SIZE +", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const reset = pill(this, 980, 658, 95, 52, "RESET", { fill: COLORS.cream, size: 13 }).setDepth(75);
    const done = pill(this, 1130, 658, 190, 52, "DONE", { fill: COLORS.yellow, size: 17 }).setDepth(75);
    storage.on("pointerup", () => this.openRoomStorage());
    turnLeft.on("pointerup", () => this.rotateSelectedFurniture(-15));
    turnRight.on("pointerup", () => this.rotateSelectedFurniture(15));
    flip.on("pointerup", () => this.flipSelectedFurniture());
    sizeDown.on("pointerup", () => this.resizeSelectedFurniture(-0.1));
    sizeUp.on("pointerup", () => this.resizeSelectedFurniture(0.1));
    reset.on("pointerup", () => this.resetFurnitureDraft());
    done.on("pointerup", () => {
      SaveGame.setDecorLayout(this.draftDecorPositions);
      sound(this, "buy");
      this.scene.restart({ page: this.page });
    });
    parts.push(blocker, banner, title, this.editorHint, storage, turnLeft, turnRight, flip, sizeDown, sizeUp, reset, done);

    Object.entries(this.roomFurniture).forEach(([id, visual]) => {
      const labelY = Math.max(155, visual.y - visual.displayHeight * 0.5 - 12);
      const label = this.add.text(visual.x, labelY, HOME_ITEMS.find((item) => item.id === id)?.name || id, textStyle(12, "#fff7df"))
        .setOrigin(0.5)
        .setDepth(73)
        .setBackgroundColor("#34283ad9")
        .setPadding(7, 3);
      visual.setDepth(72).setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(visual);
      visual.on("pointerdown", () => this.selectFurniture(id));
      visual.on("dragstart", () => {
        this.selectFurniture(id);
        const transform = this.draftDecorPositions[id];
        visual.setScale((transform.flipX ? -1 : 1) * transform.size * 1.04, transform.size * 1.04).setDepth(76);
        label.setDepth(77);
      });
      visual.on("drag", (_pointer, dragX, dragY) => {
        const position = roomPosition(id, { ...this.draftDecorPositions[id], x: dragX, y: dragY });
        this.draftDecorPositions[id] = position;
        visual.setPosition(position.x, position.y);
        label.setPosition(position.x, Math.max(155, position.y - visual.displayHeight * 0.5 - 12));
      });
      visual.on("dragend", () => {
        const transform = this.draftDecorPositions[id];
        visual.setScale((transform.flipX ? -1 : 1) * transform.size, transform.size).setDepth(72);
        label.setDepth(73);
      });
      this.editorLabels[id] = label;
      parts.push(label);
    });
    this.selectFurniture(Object.keys(this.roomFurniture)[0]);
    this.editorParts = parts;
  }

  selectFurniture(id) {
    if (!this.draftDecorPositions?.[id]) return;
    this.selectedFurnitureId = id;
    Object.entries(this.editorLabels || {}).forEach(([itemId, label]) => {
      label.setBackgroundColor(itemId === id ? "#ec5966ee" : "#34283ad9");
    });
    const name = HOME_ITEMS.find((item) => item.id === id)?.name || id;
    const transform = this.draftDecorPositions[id];
    this.editorHint?.setText(`Selected: ${name} · ${Math.round(transform.size * 100)}% · ${Math.round(transform.angle)}° · Done saves`);
  }

  applyFurnitureDraft(id) {
    const visual = this.roomFurniture[id];
    const transform = this.draftDecorPositions[id];
    if (!visual || !transform) return;
    visual.setPosition(transform.x, transform.y);
    visual.setAngle(transform.angle);
    visual.setScale((transform.flipX ? -1 : 1) * transform.size, transform.size);
    this.editorLabels[id]?.setPosition(
      transform.x,
      Math.max(155, transform.y - visual.displayHeight * 0.5 - 12)
    );
  }

  rotateSelectedFurniture(delta) {
    const id = this.selectedFurnitureId;
    if (!id) return;
    this.draftDecorPositions[id] = roomPosition(id, {
      ...this.draftDecorPositions[id],
      angle: this.draftDecorPositions[id].angle + delta
    });
    this.applyFurnitureDraft(id);
    this.selectFurniture(id);
    sound(this, "jump");
  }

  flipSelectedFurniture() {
    const id = this.selectedFurnitureId;
    if (!id) return;
    this.draftDecorPositions[id] = roomPosition(id, {
      ...this.draftDecorPositions[id],
      flipX: !this.draftDecorPositions[id].flipX
    });
    this.applyFurnitureDraft(id);
    this.selectFurniture(id);
    sound(this, "jump");
  }

  resizeSelectedFurniture(delta) {
    const id = this.selectedFurnitureId;
    if (!id) return;
    this.draftDecorPositions[id] = roomPosition(id, {
      ...this.draftDecorPositions[id],
      size: this.draftDecorPositions[id].size + delta
    });
    this.applyFurnitureDraft(id);
    this.selectFurniture(id);
    sound(this, "jump");
  }

  resetFurnitureDraft() {
    Object.keys(this.roomFurniture).forEach((id) => {
      this.draftDecorPositions[id] = roomPosition(id);
      this.applyFurnitureDraft(id);
    });
    this.selectFurniture(this.selectedFurnitureId);
    sound(this, "buy");
  }

  openRoomStorage() {
    this.closeOverlay();
    const parts = [];
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(80).setInteractive();
    const panel = this.add.rectangle(640, 360, 960, 610, COLORS.cream).setDepth(81);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 90, "CAT HOUSE STORAGE", textStyle(32, "#ec5966")).setOrigin(0.5).setDepth(82);
    const sub = this.add.text(640, 128, "Tap owned furniture to place or store it", textStyle(16, "#725f72")).setOrigin(0.5).setDepth(82);
    parts.push(shade, panel, title, sub);
    HOME_ITEMS.forEach(({ id, name }, index) => {
      const owned = this.save.owned.includes(id);
      const active = this.save.activeDecor.includes(id);
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 295 + col * 230;
      const y = 275 + row * 190;
      const card = this.add.rectangle(x, y, 195, 155, active ? 0xd9f2dc : owned ? 0xffffff : 0xb9afb7).setDepth(82);
      card.setStrokeStyle(5, active ? COLORS.teal : COLORS.ink);
      const symbol = owned
        ? createItemPreview(this, id, x, y - 27, { scale: 0.72, depth: 83 })
        : this.add.text(x, y - 25, "🔒", textStyle(38, "#7d717c")).setOrigin(0.5).setDepth(83);
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
