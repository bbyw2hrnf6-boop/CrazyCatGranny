import { addCoin, addTreat } from "../../objects/Collectibles.js";
import { planCourse } from "../../levels/CoursePlanner.js";
import { COLORS } from "../../ui/ui.js";

export class CourseBuilder {
  constructor(scene) {
    this.scene = scene;
  }

  create() {
    const scene = this.scene;
    const length = scene.level.length;
    const course = planCourse(scene.level);
    const { gaps, raised, hooks, obstacles, coins, awnings, authoredMoments } = course;
    let cursor = 0;
    for (const [start, end] of gaps) {
      this.addPlatform(cursor, 590, start - cursor, 160);
      cursor = end;
    }
    this.addPlatform(cursor, 590, length - cursor + 500, 160);

    raised.forEach(([x, y, width], index) => {
      if (x < length - 300) this.addPlatform(x, y, width, 34, index % 2 ? 0xc97b54 : 0xf2c56e);
    });

    authoredMoments.forEach((moment) => this.createSetPiece(moment));

    hooks.forEach((point) => {
      this.decorateHookRoute(point);
      const hook = scene.add.image(point.x, point.y, "hook").setDepth(8);
      hook.setData("used", false);
      hook.setData("required", point.required);
      hook.setData("reason", point.reason || "gap");
      if (point.required) {
        hook.setScale(1.12).setTint(0xffe17a);
        scene.tweens.add({ targets: hook, scale: 1.22, duration: 650, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else if (point.reason === "setpiece") {
        hook.setScale(1.1).setTint(0xff9bd9);
        scene.tweens.add({ targets: hook, scale: 1.2, angle: 8, duration: 520, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else if (point.reason === "obstacle") {
        hook.setScale(1.04).setTint(0x9ff3e6);
        scene.tweens.add({ targets: hook, y: hook.y - 5, duration: 820, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      }
      scene.hooks.add(hook);
    });

    obstacles.forEach(({ x, texture }) => {
      const config = this.obstacleConfig(texture);
      const obstacle = scene.breakables.create(x, config.y, texture);
      obstacle.setScale(config.scale).refreshBody();
      obstacle.setData("type", texture);
      obstacle.setData("decor", this.decorateObstacle(obstacle, texture, config));
      scene.tweens.add({
        targets: obstacle,
        angle: texture === "glass" ? 1.6 : 0.9,
        duration: 620 + Math.round(x % 5) * 60,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
    });

    coins.forEach(({ x, y }) => addCoin(scene, x, y, scene.coins));
    scene.courseGaps = gaps;
    scene.obstacleXs = obstacles.map((entry) => entry.x);
    scene.raisedPlatforms = raised;

    [
      [Math.round(length * 0.18), 350],
      [Math.round(length * 0.52), 300],
      [Math.round(length * 0.86), 285]
    ].forEach(([x, y]) => addTreat(scene, x, y, scene.treats));

    awnings.forEach(({ x, y, width }) => {
      const awning = this.addPlatform(x, y, width, 24, 0xe85e68);
      awning.setData("bounce", true);
    });
  }

  decorateHookRoute(point) {
    const scene = this.scene;
    const color = point.required ? 0xffe17a : point.reason === "setpiece" ? 0xff9bd9 : 0x9ff3e6;
    const alpha = point.required ? 0.34 : 0.22;
    const cue = scene.add.graphics().setDepth(5);
    cue.lineStyle(point.required ? 5 : 3, color, alpha);
    cue.beginPath();
    const start = { x: point.x - 190, y: point.y + 110 };
    const control = { x: point.x, y: point.y - 85 };
    const end = { x: point.x + 210, y: point.y + 122 };
    cue.moveTo(start.x, start.y);
    for (let step = 1; step <= 24; step += 1) {
      const t = step / 24;
      const inverse = 1 - t;
      cue.lineTo(
        inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
        inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y
      );
    }
    cue.strokePath();
    const dots = [-130, -65, 0, 65, 130].map((offset, index) => {
      const dot = scene.add.image(point.x + offset, point.y + 70 - Math.abs(offset) * 0.46, "sparkle")
        .setTint(color)
        .setAlpha(alpha + 0.12)
        .setScale(point.required ? 0.28 : 0.2)
        .setDepth(6);
      scene.tweens.add({
        targets: dot,
        alpha: alpha + 0.34,
        scale: dot.scale + 0.08,
        duration: 360 + index * 75,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut"
      });
      return dot;
    });
    scene.tweens.add({ targets: cue, alpha: alpha + 0.18, duration: 720, yoyo: true, repeat: -1 });
    return [cue, ...dots];
  }

  createSetPiece(moment) {
    const scene = this.scene;
    const x = moment.x;
    const color = {
      "bridge-swing": 0xc88a58,
      "dragon-bridge": 0xff6e9f,
      "freeway-chain": 0xf7df65,
      "coaster-drop": 0xff6e9f,
      "carnival-cannon": 0xffcc4d,
      "firework-boost": 0xffdc63,
      "hook-maze": 0xbdefff,
      "finale-stage": 0xff6e9f
    }[moment.type] || scene.worldData.accent;
    const rail = scene.add.rectangle(x, 372, moment.width, 10, color, 0.36)
      .setStrokeStyle(3, COLORS.ink, 0.45)
      .setDepth(6);
    const posts = [-230, 230].map((offset) => scene.add.rectangle(x + offset, 435, 14, 145, COLORS.ink, 0.38).setDepth(5));
    if (moment.type === "carnival-cannon") {
      const cannon = scene.add.container(x - 265, 532, [
        scene.add.ellipse(0, 28, 86, 18, 0x2f2335, 0.18),
        scene.add.rectangle(0, 0, 88, 42, 0x635080).setStrokeStyle(4, COLORS.ink),
        scene.add.circle(43, 0, 21, 0xffcc4d).setStrokeStyle(4, COLORS.ink)
      ]).setDepth(8);
      scene.tweens.add({ targets: cannon, angle: -8, duration: 520, yoyo: true, repeat: -1 });
    } else if (moment.type.includes("dragon")) {
      for (let i = 0; i < 4; i += 1) {
        const orb = scene.add.image(x - 210 + i * 140, 333, "sparkle").setTint(color).setScale(0.45).setDepth(7);
        scene.tweens.add({ targets: orb, y: orb.y - 18, angle: 180, duration: 620 + i * 80, yoyo: true, repeat: -1 });
      }
    } else if (moment.type === "freeway-chain") {
      [-150, 0, 150].forEach((offset, index) => {
        const sign = scene.add.rectangle(x + offset, 408, 86, 38, index % 2 ? 0xe86255 : 0xf7df65)
          .setStrokeStyle(4, COLORS.ink)
          .setDepth(7);
        scene.tweens.add({ targets: sign, y: sign.y - 8, duration: 360 + index * 80, yoyo: true, repeat: -1 });
      });
    }
    scene.tweens.add({ targets: [rail, ...posts], alpha: 0.62, duration: 760, yoyo: true, repeat: -1 });
  }

  decorateObstacle(obstacle, texture, config) {
    const scene = this.scene;
    const y = obstacle.y;
    const shadow = scene.add.ellipse(obstacle.x, 589, config.height * config.scale * 0.86, 15, 0x201727, 0.18).setDepth(6);
    const shine = scene.add.rectangle(
      obstacle.x - config.height * config.scale * 0.16,
      y - config.height * config.scale * 0.2,
      Math.max(18, config.height * config.scale * 0.32),
      5,
      0xffffff,
      0.28
    ).setDepth(10).setAngle(-10);
    const accentColor = {
      crate: 0xf0b36b,
      glass: 0xc7f5ff,
      bicycle: 0xffcc4d,
      "tulip-cart": 0xf06a72,
      "lantern-gate": 0xffdc63,
      "road-barrier": 0xf7df65,
      "carnival-drum": 0xff6e9f
    }[texture] || scene.worldData.accent;
    const accent = scene.add.circle(obstacle.x + config.height * config.scale * 0.24, y - config.height * config.scale * 0.18, 7, accentColor, 0.72)
      .setStrokeStyle(2, COLORS.ink, 0.35)
      .setDepth(10);
    scene.tweens.add({ targets: [shine, accent], y: "-=5", alpha: 0.62, duration: 720, yoyo: true, repeat: -1 });
    return [shadow, shine, accent];
  }

  addPlatform(x, y, width, height, color = this.scene.worldData.ground) {
    const scene = this.scene;
    if (width <= 0) return null;
    const platform = scene.add.rectangle(x + width / 2, y + height / 2, width, height, color);
    platform.setStrokeStyle(5, Phaser.Display.Color.IntegerToColor(color).darken(18).color);
    scene.physics.add.existing(platform, true);
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.up = true;
    scene.platforms.add(platform);
    scene.add.rectangle(x + width / 2, y + 10, width, 20, scene.worldData.accent).setDepth(2);
    scene.add.rectangle(x + width / 2, y + 20, width - 8, 6, 0xffffff, 0.2).setDepth(3);
    scene.add.rectangle(x + width / 2, y + 30, width, 12, 0x201727, 0.12).setDepth(2);
    const texture = scene.add.graphics().setDepth(2);
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(24).color;
    const light = Phaser.Display.Color.IntegerToColor(color).lighten(18).color;
    const isRaised = height < 80;
    if (isRaised) {
      texture.fillStyle(dark, 0.38).fillRoundedRect(x + 7, y + height - 9, width - 14, 9, 4);
      texture.fillStyle(light, 0.3).fillRoundedRect(x + 9, y + 5, Math.max(12, width - 18), 5, 3);
      texture.fillStyle(dark, 0.5)
        .fillRoundedRect(x + 6, y + 2, 12, height + 14, 4)
        .fillRoundedRect(x + width - 18, y + 2, 12, height + 14, 4);
      if (width > 170) {
        texture.fillStyle(dark, 0.28).fillRoundedRect(x + width / 2 - 5, y + height - 2, 10, 48, 4);
      }
    }
    for (let offset = 12, tile = 0; offset < width - 8; offset += 72, tile += 1) {
      texture.fillStyle(tile % 2 ? dark : light, 0.22)
        .fillRoundedRect(x + offset, y + 39 + (tile % 3) * 9, Math.min(55, width - offset), 14, 5);
      texture.lineStyle(2, dark, 0.24).beginPath()
        .moveTo(x + offset + 4, y + 58).lineTo(x + offset + 19, y + 64).strokePath();
      if (width > 520 && offset > 140 && offset < width - 140 && tile % 4 === 0) {
        texture.lineStyle(3, dark, 0.2).beginPath()
          .moveTo(x + offset - 10, y + 4)
          .lineTo(x + offset - 10, y + Math.min(height - 8, 128))
          .strokePath();
      }
      if (scene.level.world === 2 && tile % 3 === 0) {
        texture.fillStyle(0xe7d9a6, 0.45).fillCircle(x + offset + 28, y + 34, 3);
      } else if (scene.level.world === 5 && tile % 2 === 0) {
        texture.fillStyle(0xffd660, 0.5).fillCircle(x + offset + 29, y + 48, 3);
      } else if (scene.level.world === 3 && tile % 3 === 1) {
        texture.fillStyle(0xffcc55, 0.42).fillRoundedRect(x + offset + 18, y + 45, 24, 5, 2);
      } else if (scene.level.world === 4 && tile % 3 === 2) {
        texture.fillStyle(0xf7df65, 0.38).fillRect(x + offset + 18, y + 42, 28, 4);
      }
    }
    return platform;
  }

  obstacleConfig(texture) {
    const settings = {
      crate: { height: 86, scale: 1.02 },
      glass: { height: 112, scale: 0.98 },
      bicycle: { height: 82, scale: 0.98 },
      "tulip-cart": { height: 92, scale: 1.02 },
      "lantern-gate": { height: 120, scale: 0.92 },
      "road-barrier": { height: 74, scale: 1.08 },
      "carnival-drum": { height: 88, scale: 1.05 }
    };
    const config = settings[texture] || { height: 90, scale: 1 };
    return {
      ...config,
      y: 590 - (config.height * config.scale) / 2
    };
  }
}
