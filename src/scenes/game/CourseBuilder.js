import { addCoin, addTreat } from "../../objects/Collectibles.js";
import { planCourse } from "../../levels/CoursePlanner.js";

export class CourseBuilder {
  constructor(scene) {
    this.scene = scene;
  }

  create() {
    const scene = this.scene;
    const length = scene.level.length;
    const course = planCourse(scene.level);
    const { gaps, raised, hooks, obstacles, coins, awnings } = course;
    let cursor = 0;
    for (const [start, end] of gaps) {
      this.addPlatform(cursor, 590, start - cursor, 160);
      cursor = end;
    }
    this.addPlatform(cursor, 590, length - cursor + 500, 160);

    raised.forEach(([x, y, width], index) => {
      if (x < length - 300) this.addPlatform(x, y, width, 34, index % 2 ? 0xc97b54 : 0xf2c56e);
    });

    hooks.forEach((point) => {
      const hook = scene.add.image(point.x, point.y, "hook").setDepth(8);
      hook.setData("used", false);
      hook.setData("required", point.required);
      hook.setData("reason", point.reason || "gap");
      if (point.required) {
        hook.setScale(1.12).setTint(0xffe17a);
        scene.tweens.add({ targets: hook, scale: 1.22, duration: 650, yoyo: true, repeat: -1, ease: "Sine.inOut" });
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
