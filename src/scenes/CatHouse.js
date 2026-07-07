import { LEVELS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { getTotalCatCount, getWorldCount } from "../content/GameContentStats.js";
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
const CAT_DEPTH_BASE = 90;
const CAT_PAW_DEPTH = 62;
const CAT_LITTER_DEPTH = 64;
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
  }

  create() {
    this.save = SaveGame.load();
    this.roomCats = [];
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
  }

  drawRoom() {
    this.add.image(640, 360, "cat-house-bg").setDisplaySize(1280, 720).setDepth(-20);
    this.add.rectangle(150, 400, 300, 640, 0xfff4dc, 0.82).setDepth(-6)
      .setStrokeStyle(4, COLORS.ink, 0.75);
    const room = createRoomDecor(this, this.save.activeDecor, this.save.decorPositions);
    this.roomFurniture = room.furniture;
    this.catPerches = room.perches;
    this.catAnchors = room.anchors || [];
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
        .setDepth(this.catDepth(y));
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
        state: "wander",
        nextChange: clockNow + random.between(450, 1800),
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
    this.time.delayedCall(260, () => this.startCatLife());
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
    this.roomCats.forEach((agent, index) => {
      if (index % 5 === 0 && this.catPerches.length) {
        const perch = this.catPerches[index % this.catPerches.length];
        agent.state = "travel-perch";
        agent.destinationPerchId = perch.id;
        agent.destinationFurniture = perch.furniture;
        this.startCatPath(agent, perch.path, this.time.now);
        agent.nextChange = this.time.now + Phaser.Math.Between(16000, 32000);
      } else {
        this.chooseCatBehavior(agent, this.time.now + index * 80, index);
      }
    });
  }

  anchorFor(type, offset = 0) {
    const anchors = (this.catAnchors || []).filter((anchor) => anchor.type === type);
    if (!anchors.length) return null;
    return anchors[Math.abs(offset) % anchors.length];
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
    if (roll >= 48 && roll < 58 && doing("eat") >= 3) roll = 0;
    if (roll >= 58 && roll < 66 && doing("drink") >= 2) roll = 0;
    if (roll >= 66 && roll < 79 && doing("play") >= 3) roll = 0;
    if (roll >= 88 && roll < 96 && doing("sleep") >= Math.max(6, Math.ceil(this.roomCats.length * 0.36))) roll = 0;
    if (roll >= 38 && roll < 48 && (!this.catPerches.length || doing("perch") >= Math.min(3, this.catPerches.length))) roll = 0;
    this.clearCatBubble(agent);
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
      agent.state = "wander";
      const targetX = Phaser.Math.Clamp(agent.x + Phaser.Math.Between(-230, 230), 350, 1210);
      const targetY = Phaser.Math.Clamp(agent.y + Phaser.Math.Between(-48, 48), 520, 610);
      this.startCatPath(agent, this.floorPath(agent, targetX, targetY), time);
      agent.nextChange = time + Phaser.Math.Between(5200, 9800);
    } else if (roll < 48 && this.catPerches.length) {
      const occupied = new Set(this.roomCats.map((cat) => cat.destinationPerchId).filter(Boolean));
      const available = this.catPerches.filter((perch) => !occupied.has(perch.id));
      const options = available.length ? available : this.catPerches;
      const perch = options[(agent.level.id + doing("perch")) % options.length];
      agent.state = "travel-perch";
      agent.destinationPerchId = perch.id;
      agent.destinationFurniture = perch.furniture;
      this.startCatPath(agent, perch.path, time);
      agent.nextChange = time + 60000;
    } else if (roll < 58) {
      agent.state = "travel-eat";
      const foodSlot = doing("eat");
      const bowl = this.anchorFor("eat", foodSlot) || { x: 1148 + foodSlot * 34, y: 574 + (foodSlot % 2) * 28 };
      this.startCatPath(agent, this.floorPath(agent, bowl.x, bowl.y), time);
      agent.destinationFurniture = bowl.furniture || null;
      agent.nextChange = time + 45000;
    } else if (roll < 66) {
      agent.state = "travel-drink";
      const waterSlot = doing("drink");
      const water = this.anchorFor("drink", waterSlot) || { x: 1092 + waterSlot * 46, y: 586 + waterSlot * 20 };
      this.startCatPath(agent, this.floorPath(agent, water.x, water.y), time);
      agent.destinationFurniture = water.furniture || null;
      agent.nextChange = time + 45000;
    } else if (roll < 79) {
      agent.state = "travel-play";
      const playAnchor = this.anchorFor("play", agent.level.id + doing("play"));
      this.startCatPath(agent, this.floorPath(
        agent,
        playAnchor ? playAnchor.x : Phaser.Math.Between(600, 900),
        playAnchor ? Phaser.Math.Clamp(playAnchor.y, 525, 600) : 585
      ), time);
      agent.destinationFurniture = playAnchor?.furniture || null;
      agent.nextChange = time + 45000;
    } else if (roll < 85 && (this.roomFurniture.aquarium || this.anchorFor("watch", agent.level.id))) {
      agent.state = "travel-watch";
      const watch = this.anchorFor("watch", agent.level.id + doing("watch"));
      this.startCatPath(agent, this.floorPath(agent, watch ? watch.x : Phaser.Math.Clamp(this.roomFurniture.aquarium.x - 42, 350, 1210), watch ? watch.y : 540), time);
      agent.destinationFurniture = watch?.furniture || "aquarium";
      agent.nextChange = time + 45000;
    } else if (roll < 88 && this.roomCats.length > 1) {
      const floorFriends = this.roomCats.filter((cat) => cat !== agent && cat.y >= 490);
      const friend = floorFriends.length
        ? Phaser.Utils.Array.GetRandom(floorFriends)
        : this.roomCats[(index + 1) % this.roomCats.length];
      agent.state = "travel-social";
      this.startCatPath(agent, this.floorPath(agent, friend.x + Phaser.Math.Between(-35, 35), Phaser.Math.Clamp(friend.y, 520, 610)), time);
      agent.nextChange = time + 40000;
    } else if (roll < 96) {
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
      agent.nextChange = time + 70000;
    } else {
      agent.state = "travel-poop";
      this.startCatPath(agent, this.floorPath(agent, Phaser.Math.Between(430, 1180), Phaser.Math.Between(555, 610)), time);
      agent.nextChange = time + 30000;
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
      sleep: Phaser.Math.Between(28000, 60000),
      poop: Phaser.Math.Between(2200, 3800)
    };
    const duration = durations[agent.state] || Phaser.Math.Between(10000, 22000);
    agent.nextChange = time + duration;
    if (agent.state === "eat" && Math.random() > 0.55) this.catSpeaks(agent, "yum", "purr", 1500);
    if (agent.state === "drink" && Math.random() > 0.68) this.catSpeaks(agent, "sip", null, 1300);
    if (agent.state === "play" && Math.random() > 0.45) this.catSpeaks(agent, "♪", "meow", 1400);
    if (agent.state === "social" && Math.random() > 0.5) this.catSpeaks(agent, "prrr", "purr", 1500);
    if (agent.state === "watch" && Math.random() > 0.5) this.catSpeaks(agent, "🐟", "purr", 1700);
    if (agent.state === "sleep") this.catSpeaks(agent, "Z z z", "purr", duration);
    if (agent.state === "poop") this.dropCatLitter(agent);
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
    this.tweens.add({ targets: [puffA, puffB], y: "-=10", alpha: 0, duration: 1200, repeat: 2 });
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
    const displayName = this.catDisplayName(level);
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(790, 370, 650, 460, COLORS.ink, 0.95).setDepth(depth);
    shade.setStrokeStyle(6, COLORS.cream);
    const portrait = createCat(this, 625, 350, level.id - 1, 0.35).setDepth(depth + 1);
    const currentHat = SaveGame.hatForCat(level.cat.id);
    const portraitHat = this.addHat(portrait, currentHat);
    if (portraitHat) this.syncCatHat({ sprite: portrait, hat: portraitHat });
    const title = this.add.text(
      865,
      235,
      displayName.toUpperCase(),
      textStyle(32, "#ffcc4d", { wordWrap: { width: 360 }, align: "center" })
    ).setOrigin(0.5).setDepth(depth + 1);
    const rarity = this.add.text(
      865,
      280,
      `${level.cat.rarity}${level.cat.limited ? " · LIMITED" : ""}`,
      textStyle(17, level.cat.limited ? "#d69cff" : "#cabacf")
    ).setOrigin(0.5).setDepth(depth + 1);
    const trait = this.add.text(865, 340, `“${level.cat.trait}”`, textStyle(20, "#fff7df", { wordWrap: { width: 300 }, align: "center" })).setOrigin(0.5).setDepth(depth + 1);
    const drop = this.save.dropHistory.find((entry) => entry.catId === level.cat.id);
    const rescueSource = drop?.type === "catbox" ? "Surprise CatBox pull" : `Three-level rescue · Level ${drop?.levelId || level.id}`;
    const rescue = this.add.text(865, 400, rescueSource, textStyle(16, "#d9c9d8")).setOrigin(0.5).setDepth(depth + 1);
    const outfit = this.add.text(865, 435, currentHat === "none" ? "Outfit: natural fur" : `Outfit: ${currentHat}`, textStyle(15, "#d9c9d8")).setOrigin(0.5).setDepth(depth + 1);
    const customize = pill(this, 705, 535, 200, 58, "✦  CUSTOMIZE", { fill: COLORS.yellow, size: 17 }).setDepth(depth + 2);
    const rename = pill(this, 910, 535, 150, 58, "RENAME", { fill: COLORS.cream, size: 17 }).setDepth(depth + 2);
    const close = pill(this, 1070, 535, 125, 58, "CLOSE", { fill: COLORS.cream, size: 17 }).setDepth(depth + 2);
    this.card = [shade, portrait, portraitHat, title, rarity, trait, rescue, outfit, customize, rename, close].filter(Boolean);
    customize.on("pointerup", () => this.openCatCustomizer(level));
    rename.on("pointerup", () => this.renameCat(level));
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
    const parts = [];
    const depth = CAT_MODAL_DEPTH;
    const shade = this.add.rectangle(640, 360, 1280, 720, COLORS.ink, 0.74).setDepth(depth).setInteractive();
    const panel = this.add.rectangle(640, 360, 920, 610, COLORS.cream).setDepth(depth + 1);
    panel.setStrokeStyle(7, COLORS.ink);
    const title = this.add.text(640, 88, `CUSTOMIZE ${this.catDisplayName(level).toUpperCase()}`, textStyle(31, "#ec5966")).setOrigin(0.5).setDepth(depth + 2);
    const portrait = createCat(this, 330, 335, level.id - 1, 0.42).setDepth(depth + 2);
    parts.push(shade, panel, title, portrait);
    const current = SaveGame.hatForCat(level.cat.id);
    const portraitHat = this.addHat(portrait, current);
    if (portraitHat) {
      this.syncCatHat({ sprite: portrait, hat: portraitHat });
      portraitHat.setDepth(depth + 3);
      parts.push(portraitHat);
    }
    [NATURAL_FUR, ...HAT_ITEMS].forEach(({ id, name, icon, color }, index) => {
      const owned = id === "none" || this.save.owned.includes(id);
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = 585 + col * 170;
      const y = 205 + row * 135;
      const card = this.add.rectangle(x, y, 145, 105, current === id ? COLORS.yellow : owned ? 0xffffff : 0xb9afb7).setDepth(depth + 2);
      card.setStrokeStyle(4, current === id ? COLORS.coral : COLORS.ink);
      const symbol = owned && id !== "none"
        ? createItemPreview(this, id, x, y - 20, { scale: 0.62, depth: depth + 3 })
        : this.add.text(x, y - 17, owned ? icon : "🔒", textStyle(31, color)).setOrigin(0.5).setDepth(depth + 3);
      const label = this.add.text(x, y + 27, name, textStyle(13, owned ? "#2f2335" : "#7d717c")).setOrigin(0.5).setDepth(depth + 3);
      parts.push(card, symbol, label);
      if (owned) {
        const hit = this.add.rectangle(x, y, 145, 105, 0xffffff, 0.001).setInteractive({ useHandCursor: true }).setDepth(depth + 4);
        hit.on("pointerup", () => {
          if (id === "none") SaveGame.clearCatHat(level.cat.id);
          else SaveGame.assignHat(id, level.cat.id);
          sound(this, "buy");
          this.scene.restart({ page: level.world });
        });
        parts.push(hit);
      }
    });
    const close = pill(this, 1040, 630, 145, 48, "CLOSE", { fill: COLORS.yellow, size: 16 }).setDepth(depth + 4);
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
    parts.push(shade, panel, title);

    if (reward.type === "catbox-coins") {
      const coin = this.add.image(640, 255, "coin").setScale(1.65).setDepth(depth + 2);
      const copy = this.add.text(640, 375, `${reward.coins} COINS!`, textStyle(34, "#f2a532")).setOrigin(0.5).setDepth(depth + 2);
      const sub = this.add.text(640, 422, "Sometimes the mystery box is full of shiny trouble money.", textStyle(18, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
      this.tweens.add({ targets: coin, y: 235, angle: 12, duration: 520, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      parts.push(coin, copy, sub);
    } else if (reward.type === "catbox") {
      const rewardLevel = LEVELS.find((level) => level.cat.id === reward.catId);
      const cat = rewardLevel ? createCat(this, 640, 270, rewardLevel.id - 1, 0.36).setDepth(depth + 2) : null;
      const copy = this.add.text(
        640,
        410,
        rewardLevel ? `${this.catDisplayName(rewardLevel).toUpperCase()} JOINED THE CAT HOUSE!` : "A NEW CAT JOINED!",
        textStyle(28, reward.limited ? "#a45ad0" : "#2f2335")
      ).setOrigin(0.5).setDepth(depth + 2);
      const sub = this.add.text(640, 450, `${reward.rarity}${reward.limited ? " · LIMITED" : ""}`, textStyle(18, "#725f72")).setOrigin(0.5).setDepth(depth + 2);
      if (cat) this.tweens.add({ targets: cat, y: 250, angle: 4, duration: 520, yoyo: true, repeat: -1, ease: "Sine.inOut" });
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
    this.overlayParts?.forEach((item) => item.destroy());
    this.overlayParts = null;
    this.referenceParts?.forEach((item) => item.destroy());
    this.referenceParts = null;
  }
}
