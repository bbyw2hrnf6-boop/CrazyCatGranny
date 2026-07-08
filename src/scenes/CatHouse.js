import { LEVELS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { getTotalCatCount, getWorldCount } from "../content/GameContentStats.js";
import { HAT_ITEMS, HOME_ITEMS, roomPosition, visualItem } from "../visual/VisualCatalog.js";
import {
  attachCatAccessory,
  createCat,
  createItemPreview,
  createRoomDecor,
  setCatAccessoryAdjustment,
  syncCatAccessory
} from "../visual/VisualFactory.js";
import { addPaperTexture, COLORS, coinBadge, pill, sound, textStyle, topBar } from "../ui/ui.js";

const NATURAL_FUR = { id: "none", name: "Natural Fur", icon: "×", color: "#8f7d8d" };
const CAT_DEPTH_BASE = 90;
const CAT_PAW_DEPTH = 62;
const CAT_LITTER_DEPTH = 64;
const CAT_PROP_DEPTH = 86;
const ROOM_EDITOR_DEPTH = 120;
const CAT_MODAL_DEPTH = 170;

export class CatHouse extends Phaser.Scene {
  constructor() {
    super("CatHouse");
  }

  init(data) {
    this.page = Phaser.Math.Clamp(data?.page || 1, 1, getWorldCount());
    this.roomEditing = false;
    this.selectedFurnitureId = null;
    this.draftDecorPositions = null;
    this.editorLabels = null;
    this.editorParts = null;
    this.referenceParts = null;
    this.nextCatVoiceAt = 0;
    this.openBoxesOnCreate = Boolean(data?.openBoxes);
  }

  create() {
    this.save = SaveGame.load();
    this.roomCats = [];
    this.input.addPointer(1);
    this.registry.set("save", this.save);
    this.drawRoom();
    addPaperTexture(this);
    topBar(this, "GRANNY'S CAT HOUSE", () => this.scene.start("MainMenu"));
    this.badge = coinBadge(this);
    this.badge.setValue(this.save.coins);
    this.add.text(715, 112, `${this.save.rescuedCats.length}/${getTotalCatCount()} CATS HOME`, textStyle(18, "#6d596d")).setOrigin(0);

    if (this.save.rescuedCats.length === 0) {
      this.add.text(785, 320, "So quiet… too quiet.", textStyle(30, "#725e72")).setOrigin(0.5);
      this.add.text(785, 370, "Rescue Mimi in Level 1!", textStyle(21, "#9a8297")).setOrigin(0.5);
      const go = pill(this, 785, 460, 260, 64, "START RESCUE", { fill: COLORS.yellow, size: 22 });
      go.on("pointerup", () => this.scene.start("LevelIntroScene", { levelId: 1 }));
    } else {
      this.placeCats();
      this.time.addEvent({
        delay: this.save.rescuedCats.length <= 3 ? 6500 : 18000,
        loop: true,
        callback: () => this.ambientCatMoment()
      });
    }

    this.add.text(63, 120, "CATALOGUE", textStyle(18, "#725e72")).setOrigin(0);
    this.catalogue();
    const previous = pill(this, 90, 505, 55, 45, "‹", { fill: COLORS.cream, size: 23 });
    const page = this.add.text(154, 505, `WORLD ${this.page}`, textStyle(15, "#725e72")).setOrigin(0.5);
    const next = pill(this, 235, 505, 55, 45, "›", { fill: COLORS.cream, size: 23 });
    previous.on("pointerup", () => this.scene.restart({ page: this.page === 1 ? getWorldCount() : this.page - 1 }));
    next.on("pointerup", () => this.scene.restart({ page: this.page === getWorldCount() ? 1 : this.page + 1 }));
    const room = pill(this, 845, 654, 230, 58, "✦  EDIT ROOM", { fill: COLORS.cream, size: 18 });
    room.on("pointerup", () => this.openRoomCustomizer());
    const shop = pill(this, 1100, 654, 245, 58, "🛍  OUTFIT SHOP", { fill: COLORS.yellow, size: 18 });
    shop.on("pointerup", () => this.scene.start("Shop"));
    this.roomActionButtons = [room, shop];
    if (this.save.pendingCatBoxes.length) {
      const boxes = pill(this, 585, 654, 245, 58, `!  CATBOX x${this.save.pendingCatBoxes.length}`, {
        fill: COLORS.coral,
        color: "#fff7df",
        size: 18
      });
      boxes.on("pointerup", () => this.openCatBoxStorage());
      this.add.rectangle(484, 628, 26, 26, COLORS.yellow).setStrokeStyle(3, COLORS.ink).setDepth(12);
      this.add.text(484, 628, "!", textStyle(20, "#2f2335")).setOrigin(0.5).setDepth(13);
      this.roomActionButtons.push(boxes);
    }
    if (this.openBoxesOnCreate && this.save.pendingCatBoxes.length) {
      this.time.delayedCall(120, () => this.openCatBoxStorage());
    }
  }

  drawRoom() {
    this.add.image(640, 360, "cat-house-bg").setDisplaySize(1280, 720).setDepth(-20);
    const roomStyle = visualItem(this.save.selectedRoomStyle);
    if (roomStyle?.kind === "roomStyle") {
      this.add.rectangle(790, 272, 980, 356, roomStyle.wallColor, 0.18).setDepth(-19);
      this.add.rectangle(790, 588, 980, 165, roomStyle.floorColor, 0.14).setDepth(-18);
    }
    this.add.rectangle(150, 400, 300, 640, 0xfff4dc, 0.82).setDepth(-6)
      .setStrokeStyle(4, COLORS.ink, 0.75);
    const room = createRoomDecor(this, this.save.activeDecor, this.save.decorPositions);
    this.roomFurniture = room.furniture;
    this.catPerches = room.perches;
    this.catAnchors = room.anchors || [];
    this.catStations = this.drawCatStations();
  }

  drawCatStations() {
    const stations = {
      food: { x: 1136, y: 594 },
      water: { x: 1192, y: 594 },
      litter: { x: 1038, y: 604 },
      toy: { x: 742, y: 598 }
    };

    const food = this.add.container(stations.food.x, stations.food.y).setDepth(CAT_PROP_DEPTH - 4);
    food.add([
      this.add.ellipse(0, 4, 54, 18, 0x2f2335, 0.15),
      this.add.ellipse(0, 0, 48, 21, 0xec5966, 1).setStrokeStyle(3, COLORS.ink),
      this.add.circle(-10, -4, 5, 0xd78a45),
      this.add.circle(4, -6, 5, 0xd78a45),
      this.add.circle(14, -2, 4, 0xd78a45)
    ]);

    const water = this.add.container(stations.water.x, stations.water.y).setDepth(CAT_PROP_DEPTH - 4);
    water.add([
      this.add.ellipse(0, 4, 54, 18, 0x2f2335, 0.15),
      this.add.ellipse(0, 0, 48, 21, 0x41b9ad, 1).setStrokeStyle(3, COLORS.ink),
      this.add.ellipse(0, -2, 30, 10, 0xbdefff, 0.85)
    ]);

    const litter = this.add.container(stations.litter.x, stations.litter.y).setDepth(CAT_PROP_DEPTH - 5);
    litter.add([
      this.add.ellipse(0, 8, 90, 18, 0x2f2335, 0.14),
      this.add.rectangle(0, 0, 86, 34, 0x7b6f88, 1).setStrokeStyle(3, COLORS.ink),
      this.add.rectangle(0, -3, 70, 18, 0xd8c7a5, 1),
      this.add.text(0, -34, "LITTER", textStyle(11, "#725f72")).setOrigin(0.5)
    ]);

    const toy = this.add.container(stations.toy.x, stations.toy.y).setDepth(CAT_PROP_DEPTH - 3);
    toy.add([
      this.add.ellipse(0, 17, 62, 12, 0x2f2335, 0.12),
      this.add.circle(-12, 0, 14, 0x7b4d86).setStrokeStyle(3, COLORS.ink),
      this.add.circle(15, 5, 9, 0xffcc4d).setStrokeStyle(2, COLORS.ink),
      this.add.line(0, 0, -2, 0, 13, 5, 0x2f2335, 0.55).setLineWidth(2)
    ]);
    this.tweens.add({ targets: toy, angle: 5, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    return stations;
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
        const displayName = this.catDisplayName(level);
        const shortName = displayName.length > 9 ? `${displayName.slice(0, 8)}...` : displayName;
        createCat(this, x + 32, y + 31, level.id - 1, 0.12);
        this.add.text(x + 32, y + 64, shortName, textStyle(12)).setOrigin(0.5);
        card.setInteractive({ useHandCursor: true }).on("pointerup", () => this.showCatCard(level));
      } else {
        this.add.text(x + 32, y + 34, "?", textStyle(28, "#8e818d")).setOrigin(0.5);
        this.add.text(x + 32, y + 64, `LV ${level.id}`, textStyle(10, "#7f737e")).setOrigin(0.5);
      }
    });
  }

  catDisplayName(level) {
    return SaveGame.catName(level.cat.id, level.cat.name);
  }

  rescuedLevels() {
    return LEVELS.filter((level) => this.save.rescuedCats.includes(level.cat.id));
  }

  refreshRoomCatHat(catId) {
    const agent = this.roomCats.find((cat) => cat.level.cat.id === catId);
    if (!agent) return;
    agent.hat?.destroy();
    agent.hat = this.addHat(agent.sprite, SaveGame.hatForCat(catId), catId);
    if (agent.hat) this.syncCatHat(agent);
  }

  placeCats() {
    const rescued = this.rescuedLevels();
    const scale = rescued.length > 32 ? 0.105 : rescued.length > 18 ? 0.125 : rescued.length > 9 ? 0.15 : 0.19;
    const clockNow = this.game.loop.time || this.time.now;
    rescued.forEach((level, order) => {
      const random = new Phaser.Math.RandomDataGenerator([`cat-${level.id}`]);
      const x = random.between(380, 1210);
      const y = random.between(515, 610);
      const cat = createCat(this, x, y, level.id - 1, scale)
        .setInteractive({ useHandCursor: true })
        .setDepth(this.catDepth(y));
      if (order % 2) cat.setFlipX(true);
      const hat = this.addHat(cat, SaveGame.hatForCat(level.cat.id), level.cat.id);
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
        state: "wander",
        nextChange: clockNow + random.between(450, 1800),
        path: [],
        moveMode: "walk",
        jump: null,
        destinationPerchId: null,
        destinationFurniture: null,
        bubble: null,
        bubbleUntil: 0,
        actionProp: null,
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
    this.time.delayedCall(260, () => this.startCatLife());
  }

  update(_time, delta) {
    this.updateCustomizerPinch();
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
      agent.sprite.setDepth(this.catDepth(agent.sprite.y));
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
      const paw = this.add.ellipse(agent.x, agent.y + 25, 9, 4, 0x6d5365, 0.14).setDepth(CAT_PAW_DEPTH);
      this.tweens.add({ targets: paw, alpha: 0, duration: 650, onComplete: () => paw.destroy() });
    }
  }

  catDepth(y) {
    return CAT_DEPTH_BASE + Math.floor(y / 8);
  }

  startCatPath(agent, path, time) {
    agent.path = path.map((point, index) => Array.isArray(point)
      ? { x: point[0], y: point[1], mode: index === 0 ? "walk" : "jump" }
      : { ...point });
    if (agent.path.length) this.startCatWaypoint(agent, agent.path.shift(), time);
  }

  floorPath(agent, targetX, targetY) {
    const start = { x: agent.x, y: agent.y, mode: "walk" };
    const end = {
      x: Phaser.Math.Clamp(targetX, 350, 1210),
      y: Phaser.Math.Clamp(targetY, 520, 610),
      mode: "walk"
    };
    const distance = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
    if (distance < 130) return [end];
    const routeY = Phaser.Math.Clamp(Math.max(start.y, end.y) + Phaser.Math.Between(18, 44), 540, 612);
    const midpoint = {
      x: Phaser.Math.Clamp((start.x + end.x) / 2 + Phaser.Math.Between(-80, 80), 350, 1210),
      y: routeY,
      mode: "walk"
    };
    return [midpoint, end];
  }

  startCatLife() {
    if (!this.roomCats?.length || this.roomEditing) return;
    const openingBehaviors = ["play", "eat", "drink", "social", "sleep", "poop", "wander", "perch"];
    this.roomCats.forEach((agent, index) => {
      const opening = openingBehaviors[index % openingBehaviors.length];
      if (opening !== "perch" || this.catPerches.length) {
        this.routeCatToBehavior(agent, this.time.now + index * 120, index, opening);
      } else if (index % 5 === 0 && this.catPerches.length) {
        const perch = this.catPerches[index % this.catPerches.length];
        agent.state = "travel-perch";
        agent.destinationPerchId = perch.id;
        agent.destinationFurniture = perch.furniture;
        this.startCatPath(agent, perch.path, this.time.now);
        agent.nextChange = this.time.now + Phaser.Math.Between(16000, 32000);
      } else {
        this.routeCatToBehavior(agent, this.time.now + index * 120, index, "wander");
      }
    });
  }

  anchorFor(type, offset = 0) {
    const anchors = (this.catAnchors || []).filter((anchor) => anchor.type === type);
    if (!anchors.length) return null;
    return anchors[Math.abs(offset) % anchors.length];
  }

  sendCatToFloor(agent, time) {
    this.clearActivityProp(agent);
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
    const smallRoom = this.roomCats.length <= 3;
    const doing = (activity) => this.roomCats.filter((cat) => (
      cat.state === activity || cat.state === `travel-${activity}`
    )).length;
    if (smallRoom && roll < 38) roll += 28;
    if (smallRoom && roll >= 88 && roll < 96) roll = Phaser.Math.Between(60, 84);
    if (roll >= 48 && roll < 58 && doing("eat") >= 3) roll = 0;
    if (roll >= 58 && roll < 66 && doing("drink") >= 2) roll = 0;
    if (roll >= 66 && roll < 79 && doing("play") >= 3) roll = 0;
    if (roll >= 88 && roll < 96 && doing("sleep") >= Math.max(6, Math.ceil(this.roomCats.length * 0.36))) roll = 0;
    if (roll >= 38 && roll < 48 && (!this.catPerches.length || doing("perch") >= Math.min(3, this.catPerches.length))) roll = 0;
    this.clearCatBubble(agent);
    this.clearActivityProp(agent);
    agent.path = [];
    agent.jump = null;
    agent.destinationPerchId = null;
    agent.destinationFurniture = null;

    if (roll < 4) {
      agent.state = "idle";
      agent.targetX = agent.x;
      agent.targetY = agent.y;
      agent.nextChange = time + Phaser.Math.Between(900, 2200);
    } else if (roll < 38) {
      this.routeCatToBehavior(agent, time, index, "wander");
    } else if (roll < 48 && this.catPerches.length) {
      this.routeCatToBehavior(agent, time, index, "perch");
    } else if (roll < 58) {
      this.routeCatToBehavior(agent, time, index, "eat");
    } else if (roll < 66) {
      this.routeCatToBehavior(agent, time, index, "drink");
    } else if (roll < 79) {
      this.routeCatToBehavior(agent, time, index, "play");
    } else if (roll < 85 && (this.roomFurniture.aquarium || this.anchorFor("watch", agent.level.id))) {
      this.routeCatToBehavior(agent, time, index, "watch");
    } else if (roll < 88 && this.roomCats.length > 1) {
      this.routeCatToBehavior(agent, time, index, "social");
    } else if (roll < 96) {
      this.routeCatToBehavior(agent, time, index, "sleep");
    } else {
      this.routeCatToBehavior(agent, time, index, "poop");
    }
    if (Math.random() > 0.995) this.catSpeaks(agent, "meow!", "meow", 1200);
  }

  routeCatToBehavior(agent, time, index, behavior) {
    const doing = (activity) => this.roomCats.filter((cat) => (
      cat.state === activity || cat.state === `travel-${activity}`
    )).length;
    this.clearCatBubble(agent);
    this.clearActivityProp(agent);
    agent.path = [];
    agent.jump = null;
    agent.destinationPerchId = null;
    agent.destinationFurniture = null;

    if (behavior === "wander") {
      agent.state = "wander";
      const targetX = Phaser.Math.Clamp(agent.x + Phaser.Math.Between(-230, 230), 350, 1210);
      const targetY = Phaser.Math.Clamp(agent.y + Phaser.Math.Between(-48, 48), 520, 610);
      this.startCatPath(agent, this.floorPath(agent, targetX, targetY), time);
      agent.nextChange = time + Phaser.Math.Between(this.roomCats.length <= 3 ? 1800 : 4200, this.roomCats.length <= 3 ? 4200 : 8200);
      return;
    }

    if (behavior === "perch" && this.catPerches.length) {
      const occupied = new Set(this.roomCats.map((cat) => cat.destinationPerchId).filter(Boolean));
      const available = this.catPerches.filter((perch) => !occupied.has(perch.id));
      const options = available.length ? available : this.catPerches;
      const perch = options[(agent.level.id + doing("perch")) % options.length];
      agent.state = "travel-perch";
      agent.destinationPerchId = perch.id;
      agent.destinationFurniture = perch.furniture;
      this.startCatPath(agent, perch.path, time);
      agent.nextChange = time + 48000;
      return;
    }

    if (behavior === "eat") {
      agent.state = "travel-eat";
      const foodSlot = doing("eat");
      const bowl = this.anchorFor("eat", foodSlot) || {
        x: this.catStations.food.x - 28 + foodSlot * 22,
        y: this.catStations.food.y - 8 + (foodSlot % 2) * 10
      };
      this.startCatPath(agent, this.floorPath(agent, bowl.x, bowl.y), time);
      agent.destinationFurniture = bowl.furniture || "food";
      agent.nextChange = time + 30000;
      return;
    }

    if (behavior === "drink") {
      agent.state = "travel-drink";
      const waterSlot = doing("drink");
      const water = this.anchorFor("drink", waterSlot) || {
        x: this.catStations.water.x - 22 + waterSlot * 20,
        y: this.catStations.water.y - 8 + (waterSlot % 2) * 10
      };
      this.startCatPath(agent, this.floorPath(agent, water.x, water.y), time);
      agent.destinationFurniture = water.furniture || "water";
      agent.nextChange = time + 30000;
      return;
    }

    if (behavior === "play") {
      agent.state = "travel-play";
      const scratcherBias = this.roomCats.length <= 3 && this.roomFurniture.scratcher && index % 2 === 0
        ? this.catAnchors.find((anchor) => anchor.furniture === "scratcher" && anchor.type === "play")
        : null;
      const playAnchor = scratcherBias || this.anchorFor("play", agent.level.id + doing("play"));
      this.startCatPath(agent, this.floorPath(
        agent,
        playAnchor ? playAnchor.x : this.catStations.toy.x + Phaser.Math.Between(-95, 95),
        playAnchor ? Phaser.Math.Clamp(playAnchor.y, 525, 600) : this.catStations.toy.y - Phaser.Math.Between(5, 30)
      ), time);
      agent.destinationFurniture = playAnchor?.furniture || "toy";
      agent.nextChange = time + 30000;
      return;
    }

    if (behavior === "watch" && (this.roomFurniture.aquarium || this.anchorFor("watch", agent.level.id))) {
      agent.state = "travel-watch";
      const watch = this.anchorFor("watch", agent.level.id + doing("watch"));
      this.startCatPath(agent, this.floorPath(
        agent,
        watch ? watch.x : Phaser.Math.Clamp(this.roomFurniture.aquarium.x - 42, 350, 1210),
        watch ? watch.y : 540
      ), time);
      agent.destinationFurniture = watch?.furniture || "aquarium";
      agent.nextChange = time + 36000;
      return;
    }

    if (behavior === "social" && this.roomCats.length > 1) {
      const floorFriends = this.roomCats.filter((cat) => cat !== agent && cat.y >= 490);
      const friend = floorFriends.length
        ? Phaser.Utils.Array.GetRandom(floorFriends)
        : this.roomCats[(index + 1) % this.roomCats.length];
      agent.state = "travel-social";
      this.startCatPath(agent, this.floorPath(agent, friend.x + Phaser.Math.Between(-35, 35), Phaser.Math.Clamp(friend.y, 520, 610)), time);
      agent.nextChange = time + 30000;
      return;
    }

    if (behavior === "sleep") {
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
        const sleep = this.anchorFor("sleep", agent.level.id + doing("sleep"));
        this.startCatPath(agent, this.floorPath(agent, sleep ? sleep.x : Phaser.Math.Between(570, 980), sleep ? sleep.y : Phaser.Math.Between(545, 605)), time);
      }
      agent.nextChange = time + 52000;
      return;
    }

    if (behavior === "poop") {
      agent.state = "travel-poop";
      this.startCatPath(agent, this.floorPath(
        agent,
        this.catStations.litter.x + Phaser.Math.Between(-30, 30),
        this.catStations.litter.y - Phaser.Math.Between(6, 18)
      ), time);
      agent.nextChange = time + 26000;
    }
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
      eat: Phaser.Math.Between(6500, 12000),
      drink: Phaser.Math.Between(5200, 9500),
      play: Phaser.Math.Between(this.roomCats.length <= 3 ? 4200 : 7000, this.roomCats.length <= 3 ? 7600 : 12000),
      social: Phaser.Math.Between(5200, 10500),
      watch: Phaser.Math.Between(8000, 18000),
      perch: Phaser.Math.Between(this.roomCats.length <= 3 ? 6500 : 14000, this.roomCats.length <= 3 ? 13000 : 28000),
      sleep: Phaser.Math.Between(22000, 52000),
      poop: Phaser.Math.Between(2200, 3800)
    };
    const duration = durations[agent.state] || Phaser.Math.Between(10000, 22000);
    agent.nextChange = time + duration;
    this.showActivityProp(agent);
    if (agent.state === "eat" && Math.random() > 0.75) this.catSpeaks(agent, "yum", "purr", 1700);
    if (agent.state === "drink" && Math.random() > 0.55) this.catSpeaks(agent, "sip", null, 1500);
    if (agent.state === "play" && Math.random() > 0.7) this.catSpeaks(agent, "mrrp!", "meow2", 1600);
    if (agent.state === "social" && Math.random() > 0.75) this.catSpeaks(agent, "prrr", "purr", 1700);
    if (agent.state === "watch" && Math.random() > 0.85) this.catSpeaks(agent, "!", "meow", 1400);
    if (agent.state === "sleep" && Math.random() > 0.85) this.catSpeaks(agent, "Z z z", "purr", duration);
    if (agent.state === "poop") this.dropCatLitter(agent);
  }

  showActivityProp(agent) {
    this.clearActivityProp(agent);
    const depth = CAT_PROP_DEPTH + Math.floor(agent.y / 10);
    const prop = this.add.container(agent.x, agent.y).setDepth(depth);
    if (agent.state === "eat") {
      prop.add([
        this.add.ellipse(0, 20, 44, 15, 0xec5966).setStrokeStyle(3, COLORS.ink),
        this.add.circle(-8, 15, 4, 0xd78a45),
        this.add.circle(5, 13, 4, 0xd78a45),
        this.add.circle(13, 17, 3, 0xd78a45)
      ]);
      this.tweens.add({ targets: prop, scaleX: 1.07, scaleY: 0.95, duration: 360, yoyo: true, repeat: -1 });
    } else if (agent.state === "drink") {
      prop.add([
        this.add.ellipse(0, 20, 44, 15, 0x41b9ad).setStrokeStyle(3, COLORS.ink),
        this.add.ellipse(0, 17, 27, 8, 0xbdefff, 0.9)
      ]);
      this.tweens.add({ targets: prop, y: agent.y - 2, duration: 420, yoyo: true, repeat: -1 });
    } else if (agent.state === "play") {
      if (agent.destinationFurniture === "scratcher") {
        prop.add([
          this.add.rectangle(0, 4, 20, 62, 0xc88755, 0.88).setStrokeStyle(3, COLORS.ink),
          this.add.line(0, 0, -9, -18, 9, -22, 0xfff7df, 0.65).setLineWidth(2),
          this.add.line(0, 0, -9, 2, 9, -2, 0xfff7df, 0.65).setLineWidth(2)
        ]);
        this.tweens.add({ targets: prop, angle: 4, y: agent.y - 7, duration: 120, yoyo: true, repeat: -1 });
      } else if (agent.destinationFurniture === "yarnbasket") {
        prop.add([
          this.add.circle(0, 18, 13, 0x7b4d86).setStrokeStyle(3, COLORS.ink),
          this.add.circle(21, 16, 8, 0xffcc4d).setStrokeStyle(2, COLORS.ink),
          this.add.line(0, 0, 0, 18, 32, 8, 0x2f2335, 0.5).setLineWidth(2)
        ]);
        this.tweens.add({ targets: prop, x: agent.x + 32, angle: 34, duration: 360, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else if (agent.destinationFurniture === "fishcondo") {
        prop.add([
          this.add.ellipse(0, 18, 42, 18, 0x50a9b5, 0.3).setStrokeStyle(2, COLORS.ink),
          this.add.text(0, -18, "peek", textStyle(11, "#2f2335")).setOrigin(0.5)
        ]);
        this.tweens.add({ targets: prop, scaleX: 1.18, scaleY: 0.82, alpha: 0.58, duration: 480, yoyo: true, repeat: -1 });
      } else if (agent.destinationFurniture === "catbridge") {
        prop.add([
          this.add.text(-12, -34, "↗", textStyle(18, "#ffcc4d")).setOrigin(0.5),
          this.add.text(12, -24, "↘", textStyle(18, "#ffcc4d")).setOrigin(0.5)
        ]);
        this.tweens.add({ targets: prop, x: agent.x + 18, y: agent.y - 10, duration: 360, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else {
        prop.add([
          this.add.circle(0, 18, 13, 0x7b4d86).setStrokeStyle(3, COLORS.ink),
          this.add.line(0, 0, 0, 18, 28, 8, 0x2f2335, 0.5).setLineWidth(2)
        ]);
        this.tweens.add({ targets: prop, x: agent.x + 24, angle: 28, duration: 520, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }
    } else if (agent.state === "social") {
      prop.add([
        this.add.text(-16, -38, "♥", textStyle(24, "#ec5966")).setOrigin(0.5),
        this.add.text(14, -28, "♥", textStyle(17, "#ff9bb0")).setOrigin(0.5)
      ]);
      this.tweens.add({ targets: prop, y: agent.y - 10, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    } else if (agent.state === "watch") {
      prop.add([
        this.add.circle(0, -34, 16, 0xbdefff, 0.88).setStrokeStyle(2, COLORS.ink),
        this.add.text(0, -35, agent.destinationFurniture === "aquarium" ? "◦" : "!", textStyle(17, "#2f2335")).setOrigin(0.5)
      ]);
      this.tweens.add({ targets: prop, x: agent.x + 12, scale: 1.08, duration: 520, yoyo: true, repeat: -1 });
    } else if (agent.state === "sleep") {
      prop.add(this.add.text(18, -42, "Z z", textStyle(18, "#76508a")).setOrigin(0.5));
      this.tweens.add({ targets: prop, y: agent.y - 16, alpha: 0.45, duration: 1300, yoyo: true, repeat: -1 });
    } else if (agent.state === "poop") {
      prop.add(this.add.text(0, -42, "!", textStyle(20, "#76508a")).setOrigin(0.5));
      this.tweens.add({ targets: prop, y: agent.y - 8, duration: 260, yoyo: true, repeat: 3 });
    }
    if (!prop.list?.length) {
      prop.destroy();
      return;
    }
    agent.actionProp = prop;
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
      scaleX = agent.baseScale * (agent.destinationFurniture === "velvetsofa" ? 1.18 + Math.max(0, breath) * 0.05 : 1.12);
      scaleY = agent.baseScale * (0.72 + breath * 0.012);
      angle = agent.sprite.flipX ? -4 : 4;
      if (agent.bubble) agent.bubble.setAlpha(0.58 + Math.sin(time * 0.002) * 0.25);
    } else if (agent.state === "eat" || agent.state === "drink") {
      const dip = (Math.sin(time * 0.0055 + agent.phase) + 1) / 2;
      y = agent.y + dip * 5;
      angle = agent.sprite.flipX ? dip * 2.5 : -dip * 2.5;
      scaleY *= 1 - dip * 0.025;
    } else if (agent.state === "play") {
      const pounce = Math.max(0, Math.sin(time * (agent.destinationFurniture === "scratcher" ? 0.011 : 0.0065) + agent.phase));
      y = agent.y - pounce * (agent.destinationFurniture === "scratcher" ? 4 : 8);
      x = agent.x + Math.sin(time * 0.004 + agent.phase) * (agent.destinationFurniture === "scratcher" ? 2 : 5);
      angle = Math.sin(time * 0.0065 + agent.phase) * (agent.destinationFurniture === "scratcher" ? 1.2 : 3);
      if (agent.destinationFurniture === "scratcher") scaleY *= 1 + pounce * 0.08;
    } else if (agent.state === "watch" && agent.destinationFurniture === "aquarium") {
      x = agent.x + Math.sin(time * 0.003 + agent.phase) * 2;
      angle = agent.sprite.flipX ? -3 - breath : 3 + breath;
      scaleX *= 1.04;
    } else if (agent.state === "social") {
      x = agent.x + Math.sin(time * 0.0028 + agent.phase) * 3;
      angle = Math.sin(time * 0.003 + agent.phase) * 1.4;
    } else if (agent.state === "poop") {
      y = agent.y + 4;
      scaleX = agent.baseScale * 1.04;
      scaleY = agent.baseScale * 0.9;
      angle = agent.sprite.flipX ? -2 : 2;
    }

    agent.sprite.setPosition(x, y);
    agent.sprite.setScale(scaleX, scaleY);
    agent.sprite.setAngle(angle);
  }

  dropCatLitter(agent) {
    const litter = this.add.container(agent.x - (agent.sprite.flipX ? -18 : 18), agent.y + 22).setDepth(CAT_LITTER_DEPTH);
    const spot = this.add.ellipse(0, 0, 18, 8, 0x6b4a33, 0.55);
    const puffA = this.add.text(-8, -16, "~", textStyle(12, "#7b6a5f")).setOrigin(0.5).setAlpha(0.55);
    const puffB = this.add.text(7, -21, "~", textStyle(12, "#7b6a5f")).setOrigin(0.5).setAlpha(0.45);
    litter.add([spot, puffA, puffB]);
    const stink = this.add.container(agent.x + (agent.sprite.flipX ? -28 : 28), agent.y - 18).setDepth(CAT_LITTER_DEPTH + 2);
    stink.add([
      this.add.ellipse(-12, 8, 30, 20, 0x91c96f, 0.28),
      this.add.ellipse(10, -2, 36, 24, 0x91c96f, 0.24),
      this.add.ellipse(26, 10, 25, 18, 0x91c96f, 0.2),
      this.add.text(9, -25, "PHEW", textStyle(12, "#6c8f55")).setOrigin(0.5)
    ]);
    this.tweens.add({ targets: [puffA, puffB], y: "-=10", alpha: 0, duration: 1200, repeat: 2 });
    this.tweens.add({
      targets: stink,
      y: stink.y - 34,
      alpha: 0,
      scale: 1.25,
      duration: 1450,
      ease: "Sine.out",
      onComplete: () => stink.destroy()
    });
    this.tweens.add({
      targets: litter,
      alpha: 0,
      delay: 9000,
      duration: 1200,
      onComplete: () => litter.destroy()
    });
  }

  catSpeaks(agent, label, kind, duration = 1400) {
    this.clearCatBubble(agent);
    agent.bubble = this.add.text(
      agent.x,
      agent.y,
      label,
      textStyle(label.startsWith("Z") ? 13 : 12, "#76508a")
    )
      .setOrigin(0.5)
      .setBackgroundColor("#fff7dfdd")
      .setPadding(7, 3);
    agent.bubbleUntil = this.time.now + duration;
    if (kind && this.time.now >= this.nextCatVoiceAt) {
      this.nextCatVoiceAt = this.time.now + Phaser.Math.Between(6500, 11000);
      sound(this, kind);
    }
  }

  clearCatBubble(agent) {
    agent.bubble?.destroy();
    agent.bubble = null;
    agent.bubbleUntil = 0;
  }

  clearActivityProp(agent) {
    agent.actionProp?.destroy();
    agent.actionProp = null;
  }

  ambientCatMoment() {
    const awake = this.roomCats.filter((agent) => agent.state !== "sleep");
    if (!awake.length) return;
    const agent = Phaser.Utils.Array.GetRandom(awake);
    this.catSpeaks(
      agent,
      Math.random() > 0.28 ? "meow!" : "mrrp",
      Math.random() > 0.65 ? "meow" : "purr",
      1500
    );
  }

  addHat(cat, hat, catId = null, adjustment = null) {
    const savedAdjustment = catId && hat !== "none" ? SaveGame.hatAdjustment(catId, hat) : null;
    return attachCatAccessory(this, cat, hat, cat.depth + 1, adjustment || savedAdjustment);
  }

  syncCatHat(agent) {
    syncCatAccessory(agent.sprite, agent.hat);
  }

  showCatCard(level) {
    this.card?.forEach((item) => item.destroy());
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    const rescued = this.rescuedLevels();
    const currentIndex = rescued.findIndex((entry) => entry.cat.id === level.cat.id);
    const hasCatNav = rescued.length > 1 && currentIndex >= 0;
    const displayName = this.catDisplayName(level);
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(820, 370, 590, 405, COLORS.ink, 0.95).setDepth(depth);
    shade.setStrokeStyle(6, COLORS.cream);
    const portrait = createCat(this, 660, 350, level.id - 1, 0.29).setDepth(depth + 1);
    const currentHat = SaveGame.hatForCat(level.cat.id);
    const portraitHat = this.addHat(portrait, currentHat, level.cat.id);
    if (portraitHat) this.syncCatHat({ sprite: portrait, hat: portraitHat });
    const title = this.add.text(
      915,
      240,
      displayName.toUpperCase(),
      textStyle(30, "#ffcc4d", { wordWrap: { width: 300 }, align: "center" })
    ).setOrigin(0.5).setDepth(depth + 1);
    const rarity = this.add.text(
      915,
      282,
      `${level.cat.rarity}${level.cat.limited ? " · LIMITED" : ""}`,
      textStyle(17, level.cat.limited ? "#d69cff" : "#cabacf")
    ).setOrigin(0.5).setDepth(depth + 1);
    const trait = this.add.text(915, 338, `“${level.cat.trait}”`, textStyle(19, "#fff7df", { wordWrap: { width: 290 }, align: "center" })).setOrigin(0.5).setDepth(depth + 1);
    const drop = this.save.dropHistory.find((entry) => entry.catId === level.cat.id);
    const rescueSource = drop?.type === "catbox" ? "Surprise CatBox pull" : `Two-level rescue · Level ${drop?.levelId || level.id}`;
    const rescue = this.add.text(915, 400, rescueSource, textStyle(15, "#d9c9d8")).setOrigin(0.5).setDepth(depth + 1);
    const outfit = this.add.text(915, 430, currentHat === "none" ? "Outfit: natural fur" : `Outfit: ${currentHat}`, textStyle(14, "#d9c9d8")).setOrigin(0.5).setDepth(depth + 1);
    const customize = pill(this, 680, 532, 180, 54, "✦ CUSTOMIZE", { fill: COLORS.yellow, size: 15 }).setDepth(depth + 2);
    const rename = pill(this, 870, 532, 150, 54, "RENAME", { fill: COLORS.cream, size: 15 }).setDepth(depth + 2);
    const close = pill(this, 1035, 532, 130, 54, "CLOSE", { fill: COLORS.cream, size: 15 }).setDepth(depth + 2);
    const previous = hasCatNav ? pill(this, 545, 370, 58, 72, "←", { fill: COLORS.cream, size: 24 }).setDepth(depth + 2) : null;
    const next = hasCatNav ? pill(this, 1095, 370, 58, 72, "→", { fill: COLORS.cream, size: 24 }).setDepth(depth + 2) : null;
    this.card = [shade, portrait, portraitHat, title, rarity, trait, rescue, outfit, customize, rename, close, previous, next].filter(Boolean);
    customize.on("pointerup", () => this.openCatCustomizer(level));
    rename.on("pointerup", () => this.renameCat(level));
    previous?.on("pointerup", () => this.showCatCard(rescued[(currentIndex + rescued.length - 1) % rescued.length]));
    next?.on("pointerup", () => this.showCatCard(rescued[(currentIndex + 1) % rescued.length]));
    close.on("pointerup", () => {
      this.card.forEach((item) => item.destroy());
      this.card = null;
    });
  }

  renameCat(level) {
    if (typeof window === "undefined") return;
    const nextName = window.prompt("Name this cat", this.catDisplayName(level));
    if (nextName === null) return;
    if (!SaveGame.renameCat(level.cat.id, nextName)) return;
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    sound(this, "buy");
    this.showCatCard(level);
  }

  openCatCustomizer(level) {
    this.card?.forEach((item) => item.destroy());
    this.card = null;
    this.closeOverlay();
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    const parts = [];
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(depth).setInteractive();
    const panel = this.add.rectangle(640, 360, 920, 610, COLORS.cream).setDepth(depth + 1);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 88, `CUSTOMIZE ${this.catDisplayName(level).toUpperCase()}`, textStyle(31, "#ec5966")).setOrigin(0.5).setDepth(depth + 2);
    const current = SaveGame.hatForCat(level.cat.id);
    const portrait = createCat(this, 330, 315, level.id - 1, 0.46).setDepth(depth + 2);
    const previewLabel = this.add.text(330, 545, "PREVIEW ONLY", textStyle(15, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
    const adjustmentLabel = this.add.text(330, 575, "", textStyle(13, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
    const selectedLabel = this.add.text(330, 118, "", textStyle(20, "#2f2335")).setOrigin(0.5).setDepth(depth + 2);
    const anchorMarkers = this.createCatAnchorMarkers(portrait, depth + 4);
    parts.push(shade, panel, title, portrait, previewLabel, adjustmentLabel, selectedLabel, ...anchorMarkers);
    this.catCustomizer = {
      level,
      depth,
      parts,
      portrait,
      previewHat: null,
      selectedHat: current,
      draft: { ...SaveGame.hatAdjustment(level.cat.id, current) },
      dragStart: null,
      pinchStart: null,
      cards: {},
      adjustmentLabel,
      selectedLabel
    };
    [NATURAL_FUR, ...HAT_ITEMS].forEach(({ id, name, icon, color }, index) => {
      const owned = id === "none" || this.save.owned.includes(id);
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 548 + col * 128;
      const y = 168 + row * 98;
      const card = this.add.rectangle(x, y, 112, 78, owned ? 0xffffff : 0xb9afb7).setDepth(depth + 2);
      card.setStrokeStyle(4, COLORS.ink);
      card.setData("owned", owned);
      const symbol = owned && id !== "none"
        ? createItemPreview(this, id, x, y - 16, { scale: 0.46, depth: depth + 3 })
        : this.add.text(x, y - 13, owned ? icon : "🔒", textStyle(26, color)).setOrigin(0.5).setDepth(depth + 3);
      const label = this.add.text(x, y + 22, name, textStyle(10, owned ? "#2f2335" : "#7d717c"), { wordWrap: { width: 96 }, align: "center" }).setOrigin(0.5).setDepth(depth + 3);
      parts.push(card, symbol, label);
      this.catCustomizer.cards[id] = card;
      if (owned) {
        const hit = this.add.rectangle(x, y, 112, 78, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(depth + 4);
        hit.on("pointerup", () => this.selectCustomizerHat(id));
        parts.push(hit);
      }
    });

    [
      ["←", 220, 630, () => this.nudgeDraftAccessory(-2, 0)],
      ["→", 285, 630, () => this.nudgeDraftAccessory(2, 0)],
      ["↑", 350, 630, () => this.nudgeDraftAccessory(0, -2)],
      ["↓", 415, 630, () => this.nudgeDraftAccessory(0, 2)],
      ["−", 480, 630, () => this.scaleDraftAccessory(-0.03)],
      ["+", 545, 630, () => this.scaleDraftAccessory(0.03)],
      ["↺", 610, 630, () => this.rotateDraftAccessory(-2)],
      ["↻", 675, 630, () => this.rotateDraftAccessory(2)]
    ].forEach(([label, x, y, action]) => {
      const button = pill(this, x, y, 52, 46, label, { fill: COLORS.cream, size: 20 }).setDepth(depth + 4);
      button.on("pointerup", action);
      parts.push(button);
    });
    const reset = pill(this, 755, 630, 120, 46, "FIT", { fill: COLORS.cream, size: 14 }).setDepth(depth + 4);
    const cancel = pill(this, 895, 630, 125, 46, "CANCEL", { fill: COLORS.cream, size: 14 }).setDepth(depth + 4);
    const apply = pill(this, 1045, 630, 145, 46, "APPLY", { fill: COLORS.yellow, size: 16 }).setDepth(depth + 4);
    reset.on("pointerup", () => this.resetDraftAccessory());
    cancel.on("pointerup", () => {
      this.closeOverlay();
      this.showCatCard(level);
    });
    apply.on("pointerup", () => this.applyCatCustomization());
    parts.push(reset, cancel, apply);
    this.overlayParts = parts;
    this.customizerWheelHandler = (_pointer, _objects, _dx, dy) => {
      if (!this.catCustomizer || this.catCustomizer.selectedHat === "none") return;
      this.scaleDraftAccessory(dy < 0 ? 0.05 : -0.05);
    };
    this.input.on("wheel", this.customizerWheelHandler);
    this.selectCustomizerHat(current);
  }

  createCatAnchorMarkers(portrait, depth) {
    const anchors = portrait.getData("anchors") || {};
    const colors = { head: COLORS.yellow, face: COLORS.teal, neck: COLORS.coral, back: 0xb994d6 };
    return Object.entries(anchors).flatMap(([name, anchor]) => {
      const x = portrait.x + anchor.x * portrait.scaleX;
      const y = portrait.y + anchor.y * portrait.scaleY;
      const dot = this.add.circle(x, y, name === "head" ? 8 : 6, colors[name] || COLORS.cream, 0.82)
        .setStrokeStyle(2, COLORS.ink, 0.7)
        .setDepth(depth);
      const label = this.add.text(x, y + 16, name.toUpperCase(), textStyle(9, "#2f2335"))
        .setOrigin(0.5)
        .setDepth(depth);
      return [dot, label];
    });
  }

  selectCustomizerHat(hatId) {
    if (!this.catCustomizer) return;
    this.catCustomizer.selectedHat = hatId;
    this.catCustomizer.draft = hatId === "none"
      ? { x: 0, y: 0, scale: 1, angle: 0 }
      : { ...SaveGame.hatAdjustment(this.catCustomizer.level.cat.id, hatId) };
    Object.entries(this.catCustomizer.cards).forEach(([id, card]) => {
      card.setFillStyle(id === hatId ? COLORS.yellow : card.getData("owned") ? 0xffffff : 0xb9afb7);
      card.setStrokeStyle(4, id === hatId ? COLORS.coral : COLORS.ink);
    });
    this.updateCustomizerPreview();
  }

  updateCustomizerPreview() {
    const customizer = this.catCustomizer;
    if (!customizer) return;
    customizer.previewHat?.destroy();
    customizer.previewHat = null;
    const hatId = customizer.selectedHat;
    this.refreshCustomizerLive();
    if (hatId === "none") return;
    customizer.previewHat = this.addHat(customizer.portrait, hatId, customizer.level.cat.id, customizer.draft);
    if (!customizer.previewHat) return;
    customizer.previewHat.setDepth(customizer.depth + 3);
    customizer.previewHat.setInteractive({ useHandCursor: true });
    this.input.setDraggable(customizer.previewHat);
    customizer.previewHat.on("dragstart", (pointer) => {
      customizer.dragStart = { x: pointer.x, y: pointer.y, draft: { ...customizer.draft } };
    });
    customizer.previewHat.on("drag", (pointer) => this.dragDraftAccessory(pointer));
    this.overlayParts.push(customizer.previewHat);
    this.refreshCustomizerLive();
  }

  refreshCustomizerLive() {
    const customizer = this.catCustomizer;
    if (!customizer) return;
    const hatId = customizer.selectedHat;
    const selectedItem = HAT_ITEMS.find((item) => item.id === hatId);
    customizer.selectedLabel.setText(hatId === "none" ? "Natural Fur" : selectedItem?.name || "Outfit");
    customizer.adjustmentLabel.setText(hatId === "none"
      ? "No accessory selected"
      : `X ${customizer.draft.x} · Y ${customizer.draft.y} · SIZE ${customizer.draft.scale.toFixed(2)} · ROT ${customizer.draft.angle}`);
    if (hatId === "none" || !customizer.previewHat) return;
    setCatAccessoryAdjustment(customizer.previewHat, customizer.draft);
    this.syncCatHat({ sprite: customizer.portrait, hat: customizer.previewHat });
  }

  dragDraftAccessory(pointer) {
    const customizer = this.catCustomizer;
    if (!customizer?.dragStart || customizer.selectedHat === "none") return;
    customizer.draft.x = Phaser.Math.Clamp(
      Math.round(customizer.dragStart.draft.x + (pointer.x - customizer.dragStart.x) / Math.abs(customizer.portrait.scaleX)),
      -220,
      220
    );
    customizer.draft.y = Phaser.Math.Clamp(
      Math.round(customizer.dragStart.draft.y + (pointer.y - customizer.dragStart.y) / Math.abs(customizer.portrait.scaleY)),
      -220,
      220
    );
    this.refreshCustomizerLive();
  }

  updateCustomizerPinch() {
    const customizer = this.catCustomizer;
    if (!customizer || customizer.selectedHat === "none") return;
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
    if (!p1?.isDown || !p2?.isDown) {
      customizer.pinchStart = null;
      return;
    }
    const distance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    if (!customizer.pinchStart) {
      customizer.pinchStart = { distance, scale: customizer.draft.scale };
      return;
    }
    if (customizer.pinchStart.distance <= 0) return;
    customizer.draft.scale = Phaser.Math.Clamp(
      Number((customizer.pinchStart.scale * (distance / customizer.pinchStart.distance)).toFixed(2)),
      0.25,
      3
    );
    this.refreshCustomizerLive();
  }

  nudgeDraftAccessory(dx, dy) {
    if (!this.catCustomizer || this.catCustomizer.selectedHat === "none") return;
    this.catCustomizer.draft.x = Phaser.Math.Clamp(this.catCustomizer.draft.x + dx, -220, 220);
    this.catCustomizer.draft.y = Phaser.Math.Clamp(this.catCustomizer.draft.y + dy, -220, 220);
    setCatAccessoryAdjustment(this.catCustomizer.previewHat, this.catCustomizer.draft);
    this.syncCatHat({ sprite: this.catCustomizer.portrait, hat: this.catCustomizer.previewHat });
    this.refreshCustomizerLive();
  }

  scaleDraftAccessory(delta) {
    if (!this.catCustomizer || this.catCustomizer.selectedHat === "none") return;
    this.catCustomizer.draft.scale = Phaser.Math.Clamp(Number((this.catCustomizer.draft.scale + delta).toFixed(2)), 0.25, 3);
    this.refreshCustomizerLive();
  }

  rotateDraftAccessory(delta) {
    if (!this.catCustomizer || this.catCustomizer.selectedHat === "none") return;
    this.catCustomizer.draft.angle = Phaser.Math.Clamp(this.catCustomizer.draft.angle + delta, -90, 90);
    this.refreshCustomizerLive();
  }

  resetDraftAccessory() {
    if (!this.catCustomizer) return;
    this.catCustomizer.draft = { x: 0, y: 0, scale: 1, angle: 0 };
    this.updateCustomizerPreview();
  }

  applyCatCustomization() {
    const customizer = this.catCustomizer;
    if (!customizer) return;
    const level = customizer.level;
    if (customizer.selectedHat === "none") SaveGame.clearCatHat(customizer.level.cat.id);
    else SaveGame.assignHat(customizer.selectedHat, customizer.level.cat.id, customizer.draft);
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    this.refreshRoomCatHat(level.cat.id);
    sound(this, "buy");
    this.closeOverlay();
    this.showCatCard(level);
  }

  openRoomCustomizer() {
    this.closeOverlay();
    this.roomEditing = true;
    this.roomActionButtons?.forEach((button) => button.setVisible(false));
    this.roomCats.forEach((agent) => {
      this.clearCatBubble(agent);
      this.clearActivityProp(agent);
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
    const depth = ROOM_EDITOR_DEPTH;
    const blocker = this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.001).setDepth(depth).setInteractive();
    const banner = this.add.rectangle(790, 116, 720, 64, COLORS.ink, 0.94).setDepth(depth + 4);
    banner.setStrokeStyle(4, COLORS.cream);
    const title = this.add.text(790, 103, "DRAG · TURN · FLIP · RESIZE", textStyle(21, "#ffdc61")).setOrigin(0.5).setDepth(depth + 5);
    this.editorHint = this.add.text(790, 130, "Select furniture · Done saves layout and rebuilds cat paths", textStyle(13, "#fff7df")).setOrigin(0.5).setDepth(depth + 5);
    const reference = pill(this, 245, 658, 95, 52, "2D REF", { fill: COLORS.cream, size: 12 }).setDepth(depth + 5);
    const storage = pill(this, 355, 658, 105, 52, "STORE", { fill: COLORS.cream, size: 13 }).setDepth(depth + 5);
    const turnLeft = pill(this, 465, 658, 105, 52, "-1°", { fill: COLORS.cream, size: 17 }).setDepth(depth + 5);
    const turnRight = pill(this, 575, 658, 105, 52, "+1°", { fill: COLORS.cream, size: 17 }).setDepth(depth + 5);
    const flip = pill(this, 680, 658, 95, 52, "FLIP", { fill: COLORS.cream, size: 13 }).setDepth(depth + 5);
    const sizeDown = pill(this, 780, 658, 95, 52, "SIZE −", { fill: COLORS.cream, size: 13 }).setDepth(depth + 5);
    const sizeUp = pill(this, 880, 658, 95, 52, "SIZE +", { fill: COLORS.cream, size: 13 }).setDepth(depth + 5);
    const reset = pill(this, 980, 658, 95, 52, "RESET", { fill: COLORS.cream, size: 13 }).setDepth(depth + 5);
    const done = pill(this, 1130, 658, 190, 52, "DONE", { fill: COLORS.yellow, size: 17 }).setDepth(depth + 5);
    reference.on("pointerup", () => this.openFurnitureReference());
    storage.on("pointerup", () => this.openRoomStorage());
    turnLeft.on("pointerup", () => this.rotateSelectedFurniture(-1));
    turnRight.on("pointerup", () => this.rotateSelectedFurniture(1));
    flip.on("pointerup", () => this.flipSelectedFurniture());
    sizeDown.on("pointerup", () => this.resizeSelectedFurniture(-0.05));
    sizeUp.on("pointerup", () => this.resizeSelectedFurniture(0.05));
    reset.on("pointerup", () => this.resetFurnitureDraft());
    done.on("pointerup", () => {
      SaveGame.setDecorLayout(this.draftDecorPositions);
      sound(this, "buy");
      this.scene.restart({ page: this.page });
    });
    parts.push(blocker, banner, title, this.editorHint, reference, storage, turnLeft, turnRight, flip, sizeDown, sizeUp, reset, done);

    Object.entries(this.roomFurniture).forEach(([id, visual]) => {
      const labelY = Math.max(155, visual.y - visual.displayHeight * 0.5 - 12);
      const label = this.add.text(visual.x, labelY, HOME_ITEMS.find((item) => item.id === id)?.name || id, textStyle(12, "#fff7df"))
        .setOrigin(0.5)
        .setDepth(depth + 3)
        .setBackgroundColor("#34283ad9")
        .setPadding(7, 3);
      visual.setDepth(depth + 2).setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(visual);
      visual.on("pointerdown", () => this.selectFurniture(id));
      visual.on("dragstart", () => {
        this.selectFurniture(id);
        const transform = this.draftDecorPositions[id];
        visual.setScale((transform.flipX ? -1 : 1) * transform.size * 1.04, transform.size * 1.04).setDepth(depth + 6);
        label.setDepth(depth + 7);
      });
      visual.on("drag", (_pointer, dragX, dragY) => {
        const position = roomPosition(id, { ...this.draftDecorPositions[id], x: dragX, y: dragY });
        this.draftDecorPositions[id] = position;
        visual.setPosition(position.x, position.y);
        label.setPosition(position.x, Math.max(155, position.y - visual.displayHeight * 0.5 - 12));
      });
      visual.on("dragend", () => {
        const transform = this.draftDecorPositions[id];
        visual.setScale((transform.flipX ? -1 : 1) * transform.size, transform.size).setDepth(depth + 2);
        label.setDepth(depth + 3);
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

  openFurnitureReference() {
    const parts = [];
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.78).setDepth(180).setInteractive();
    const panel = this.add.rectangle(640, 360, 1120, 660, COLORS.cream).setDepth(181);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 56, "2D FURNITURE FRONT + CAT ANCHORS", textStyle(29, "#ec5966")).setOrigin(0.5).setDepth(182);
    const legend = this.add.text(640, 90, "red: action · green: perch/sleep · yellow: floor/path", textStyle(14, "#725f72")).setOrigin(0.5).setDepth(182);
    parts.push(shade, panel, title, legend);

    HOME_ITEMS.forEach((item, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const x = 150 + col * 245;
      const y = 180 + row * 185;
      const card = this.add.rectangle(x, y, 205, 158, 0xfff7df).setDepth(182);
      card.setStrokeStyle(4, COLORS.ink);
      const image = item.room.wallpaper
        ? this.add.image(x, y - 28, item.texture).setDisplaySize(96, 96).setDepth(183)
        : this.add.image(x, y - 28, item.texture).setDepth(183);
      if (!item.room.wallpaper) {
        const scale = Math.min(0.42, 112 / Math.max(image.width, image.height));
        image.setScale(scale);
      }
      const floor = this.add.circle(x - 70, y + 26, 6, COLORS.yellow).setStrokeStyle(2, COLORS.ink).setDepth(184);
      const label = this.add.text(x, y + 48, item.name, textStyle(12, "#2f2335", {
        wordWrap: { width: 180 },
        align: "center"
      })).setOrigin(0.5).setDepth(184);
      const layer = this.add.text(
        x,
        y + 68,
        item.room.wallpaper ? "background layer" : item.room.y < 450 ? "wall/furniture layer" : "floor furniture layer",
        textStyle(9, "#725f72")
      ).setOrigin(0.5).setDepth(184);
      parts.push(card, image, floor, label, layer);

      (item.room.anchors || []).forEach((anchor, anchorIndex) => {
        const dotX = x + Phaser.Math.Clamp((anchor.x - item.room.x) * 0.3, -62, 62);
        const dotY = y - 28 + Phaser.Math.Clamp((anchor.y - item.room.y) * 0.3, -45, 42);
        const color = anchor.type === "sleep" ? 0x3f9f7c : 0xec5966;
        const dot = this.add.circle(dotX, dotY, anchorIndex ? 6 : 7, color).setStrokeStyle(2, 0xfff7df).setDepth(185);
        parts.push(dot);
      });
      (item.room.perches || []).slice(0, 3).forEach((perch) => {
        const dotX = x + Phaser.Math.Clamp((perch.x - item.room.x) * 0.3, -62, 62);
        const dotY = y - 28 + Phaser.Math.Clamp((perch.y - item.room.y) * 0.3, -45, 42);
        const dot = this.add.circle(dotX, dotY, 6, 0x3f9f7c).setStrokeStyle(2, 0xfff7df).setDepth(185);
        parts.push(dot);
      });
    });

    const close = pill(this, 1122, 654, 145, 48, "CLOSE", { fill: COLORS.yellow, size: 16 }).setDepth(186);
    close.on("pointerup", () => {
      parts.forEach((part) => part.destroy());
      this.referenceParts = null;
    });
    parts.push(close);
    this.referenceParts = parts;
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
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(depth).setInteractive();
    const panel = this.add.rectangle(640, 360, 960, 610, COLORS.cream).setDepth(depth + 1);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 90, "CAT HOUSE STORAGE", textStyle(32, "#ec5966")).setOrigin(0.5).setDepth(depth + 2);
    const sub = this.add.text(640, 128, "Tap owned furniture to place or store it", textStyle(16, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
    parts.push(shade, panel, title, sub);
    HOME_ITEMS.forEach(({ id, name }, index) => {
      const owned = this.save.owned.includes(id);
      const active = this.save.activeDecor.includes(id);
      const col = index % 6;
      const row = Math.floor(index / 6);
      const x = 215 + col * 170;
      const y = 275 + row * 185;
      const card = this.add.rectangle(x, y, 148, 150, active ? 0xd9f2dc : owned ? 0xffffff : 0xb9afb7).setDepth(depth + 2);
      card.setStrokeStyle(5, active ? COLORS.teal : COLORS.ink);
      const symbol = owned
        ? createItemPreview(this, id, x, y - 29, { scale: 0.56, depth: depth + 3 })
        : this.add.text(x, y - 25, "🔒", textStyle(38, "#7d717c")).setOrigin(0.5).setDepth(depth + 3);
      const label = this.add.text(x, y + 21, name, textStyle(12, "#2f2335", {
        wordWrap: { width: 132 },
        align: "center"
      })).setOrigin(0.5).setDepth(depth + 3);
      const status = this.add.text(x, y + 54, owned ? (active ? "PLACED" : "IN STORAGE") : "BUY IN SHOP", textStyle(10, active ? "#3f9f7c" : "#857884")).setOrigin(0.5).setDepth(depth + 3);
      parts.push(card, symbol, label, status);
      if (owned) {
        const hit = this.add.rectangle(x, y, 148, 150, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(depth + 4);
        hit.on("pointerup", () => {
          SaveGame.toggleDecor(id);
          sound(this, "buy");
          this.scene.restart({ page: this.page });
        });
        parts.push(hit);
      }
    });
    const close = pill(this, 1050, 630, 145, 48, "CLOSE", { fill: COLORS.yellow, size: 16 }).setDepth(depth + 4);
    close.on("pointerup", () => this.closeOverlay());
    parts.push(close);
    this.overlayParts = parts;
  }

  drawCatBoxIcon(x, y, depth = 83, scale = 1, color = 0x9467bd) {
    const g = this.add.graphics();
    g.fillStyle(0x241a2a, 0.22).fillEllipse(0, 54, 160, 24);
    g.fillStyle(color).fillRoundedRect(-70, -34, 140, 86, 13);
    g.lineStyle(6, COLORS.ink).strokeRoundedRect(-70, -34, 140, 86, 13);
    g.fillStyle(0xffe0a1).fillTriangle(-60, -33, -44, -72, -20, -33)
      .fillTriangle(20, -33, 44, -72, 60, -33);
    g.fillStyle(0xfff1c5).fillRoundedRect(-78, -48, 156, 28, 10);
    g.lineStyle(5, COLORS.ink).strokeRoundedRect(-78, -48, 156, 28, 10);
    g.fillStyle(0x3b2a40).fillCircle(0, 7, 15)
      .fillCircle(-19, -7, 8).fillCircle(0, -12, 8).fillCircle(19, -7, 8);
    const label = this.add.text(0, 36, "CATBOX", textStyle(15, "#fff7df")).setOrigin(0.5);
    return this.add.container(x, y, [g, label]).setScale(scale).setDepth(depth);
  }

  openCatBoxStorage() {
    this.closeOverlay();
    const parts = [];
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(depth).setInteractive();
    const panel = this.add.rectangle(640, 360, 840, 560, COLORS.cream).setDepth(depth + 1);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 100, "MYSTERY CATBOX STORAGE", textStyle(32, "#ec5966")).setOrigin(0.5).setDepth(depth + 2);
    const sub = this.add.text(640, 138, "Boss CatBoxes wait here until you choose to open them.", textStyle(17, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
    parts.push(shade, panel, title, sub);

    if (!this.save.pendingCatBoxes.length) {
      const empty = this.add.text(640, 335, "No CatBoxes waiting right now.", textStyle(24, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
      parts.push(empty);
    } else {
      this.save.pendingCatBoxes.slice(0, 6).forEach((box, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = 410 + col * 230;
        const y = 285 + row * 180;
        const card = this.add.rectangle(x, y, 190, 145, 0xffffff).setDepth(depth + 2);
        card.setStrokeStyle(5, COLORS.ink);
        const icon = this.drawCatBoxIcon(x, y - 20, depth + 3, 0.68, box.world === 2 ? 0xff9b4a : 0x9467bd);
        const label = this.add.text(x, y + 48, `WORLD ${box.world} BOX`, textStyle(14, "#2f2335")).setOrigin(0.5).setDepth(depth + 3);
        const hit = this.add.rectangle(x, y, 190, 145, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(depth + 4);
        hit.on("pointerup", () => this.openStoredCatBox(box.id));
        parts.push(card, icon, label, hit);
      });
    }
    const close = pill(this, 640, 620, 170, 50, "CLOSE", { fill: COLORS.yellow, size: 17 }).setDepth(depth + 4);
    close.on("pointerup", () => this.closeOverlay());
    parts.push(close);
    this.overlayParts = parts;
  }

  openStoredCatBox(boxId) {
    const reward = SaveGame.openPendingCatBox(boxId);
    this.save = SaveGame.load();
    this.registry.set("save", this.save);
    this.badge?.setValue(this.save.coins);
    sound(this, reward.type === "catbox-coins" ? "coin" : "win");
    this.showCatBoxReward(reward);
  }

  showCatBoxReward(reward) {
    this.closeOverlay();
    const parts = [];
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(depth).setInteractive();
    const panel = this.add.rectangle(640, 360, 820, 560, COLORS.cream).setDepth(depth + 1);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 104, "CATBOX OPENED!", textStyle(35, "#ec5966")).setOrigin(0.5).setDepth(depth + 2);
    const rewardWorld = Number(reward.world || reward.sourceWorld || 1);
    const box = this.drawCatBoxIcon(640, 250, depth + 2, 0.78, rewardWorld % 2 ? 0x9467bd : 0x41b9ad);
    sound(this, "box");
    this.tweens.add({
      targets: box,
      y: 230,
      angle: -7,
      scale: 0.86,
      duration: 230,
      yoyo: true,
      repeat: 1,
      ease: "Sine.inOut"
    });
    parts.push(shade, panel, title, box);

    if (reward.type === "catbox-coins") {
      const coin = this.add.image(640, 278, "coin").setScale(0.2).setAlpha(0).setDepth(depth + 3);
      const copy = this.add.text(640, 375, `${reward.coins} COINS!`, textStyle(34, "#f2a532")).setOrigin(0.5).setDepth(depth + 2);
      const sub = this.add.text(640, 422, "Sometimes the mystery box is full of shiny trouble money.", textStyle(18, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
      this.tweens.add({ targets: coin, alpha: 1, scale: 1.65, y: 235, angle: 12, duration: 520, delay: 360, ease: "Back.out" });
      this.tweens.add({ targets: coin, y: 247, angle: -8, duration: 520, delay: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      parts.push(coin, copy, sub);
    } else if (reward.type === "catbox") {
      const rewardLevel = LEVELS.find((level) => level.cat.id === reward.catId);
      const cat = rewardLevel ? createCat(this, 640, 292, rewardLevel.id - 1, 0.08).setAlpha(0).setDepth(depth + 3) : null;
      const copy = this.add.text(
        640,
        410,
        rewardLevel ? `${this.catDisplayName(rewardLevel).toUpperCase()} JOINED THE CAT HOUSE!` : "A NEW CAT JOINED!",
        textStyle(28, reward.limited ? "#a45ad0" : "#2f2335")
      ).setOrigin(0.5).setDepth(depth + 2);
      const sub = this.add.text(640, 450, `${reward.rarity}${reward.limited ? " · LIMITED" : ""}`, textStyle(18, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
      if (cat) {
        sound(this, "meow2");
        this.tweens.add({ targets: cat, alpha: 1, scale: 0.36, y: 250, angle: 4, duration: 520, delay: 330, ease: "Back.out" });
        this.tweens.add({ targets: cat, y: 262, angle: -4, duration: 520, delay: 920, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }
      parts.push(cat, copy, sub);
    } else {
      const copy = this.add.text(640, 340, "No CatBox was available.", textStyle(25, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
      parts.push(copy);
    }

    const done = pill(this, 640, 575, 220, 54, "DONE", { fill: COLORS.yellow, size: 19 }).setDepth(depth + 4);
    done.on("pointerup", () => this.scene.restart({ page: this.page }));
    parts.push(done);
    this.overlayParts = parts.filter(Boolean);
  }

  closeOverlay() {
    if (this.customizerWheelHandler) {
      this.input.off("wheel", this.customizerWheelHandler);
      this.customizerWheelHandler = null;
    }
    this.overlayParts?.forEach((item) => item.destroy());
    this.overlayParts = null;
    this.catCustomizer = null;
    this.referenceParts?.forEach((item) => item.destroy());
    this.referenceParts = null;
  }
}
