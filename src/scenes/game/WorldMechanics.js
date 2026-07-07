import { sound, textStyle } from "../../ui/ui.js";

export class WorldMechanics {
  constructor(scene) {
    this.scene = scene;
  }

  createWorldMechanics() {
    const scene = this.scene;
    if (scene.level.world === 1) return;
    const labels = {
      2: ["WIND", 0x58b5c9, "»"],
      3: ["BAMBOO", 0xe8b84d, "↑"],
      4: ["TURBO", 0xe95e63, "»"],
      5: ["MOON LIFT", 0x9c75da, "✦"]
    };
    const [label, color, icon] = labels[scene.level.world];
    const spacing = scene.level.boss ? 1150 : 1750;
    for (let x = 1650; x < scene.level.length - 600; x += spacing) {
      const width = scene.level.world === 3 ? 180 : 300;
      scene.worldZones.push({ x, width, type: scene.level.world });
      const zone = scene.add.rectangle(x, 553, width, 60, color, 0.2).setDepth(4);
      zone.setStrokeStyle(3, color, 0.65);
      scene.add.text(x, 550, `${icon} ${label}`, textStyle(14, "#fff7df")).setOrigin(0.5).setDepth(5);
      scene.tweens.add({ targets: zone, alpha: 0.38, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  applyLevelGimmick() {
    const scene = this.scene;
    const gimmick = scene.level.gimmick;
    if (["rain", "monsoon", "dike"].includes(gimmick)) {
      for (let i = 0; i < scene.performance.rainDrops; i += 1) {
        const drop = scene.add.rectangle(
          Phaser.Math.Between(0, 1280),
          Phaser.Math.Between(95, 700),
          3,
          Phaser.Math.Between(20, 42),
          0xd9f5ff,
          0.48
        ).setScrollFactor(0).setDepth(45).setAngle(14);
        scene.tweens.add({
          targets: drop,
          x: drop.x - 140,
          y: 760,
          duration: Phaser.Math.Between(650, 1100),
          delay: Phaser.Math.Between(0, 900),
          repeat: -1
        });
      }
      scene.granny.runSpeed += 18;
    }
    if (["desert", "space", "fireworks"].includes(gimmick)) scene.granny.body.setGravityY(-320);
    if (["freeway", "coaster", "boss-liberty", "boss-maestro"].includes(gimmick)) scene.granny.runSpeed += 45;
    if (["neon", "ghostlights", "mirrors"].includes(gimmick)) {
      for (let i = 0; i < 16; i += 1) {
        const light = scene.add.image(
          Phaser.Math.Between(50, 1230),
          Phaser.Math.Between(120, 510),
          "sparkle"
        ).setScrollFactor(0).setDepth(7).setAlpha(0.28).setScale(Phaser.Math.FloatBetween(0.35, 0.8));
        scene.tweens.add({ targets: light, alpha: 0.85, angle: 180, duration: 900 + i * 45, yoyo: true, repeat: -1 });
      }
    }
  }

  applyWorldMechanics() {
    const scene = this.scene;
    const now = scene.time.now;
    const zone = scene.worldZones.find((candidate) => Math.abs(scene.granny.x - candidate.x) < candidate.width / 2);
    if (!zone) return;
    if (zone.type === 2 && !scene.granny.body.blocked.down) {
      scene.granny.setVelocityX(Math.max(scene.granny.body.velocity.x, scene.granny.runSpeed + 55));
      scene.granny.setAccelerationY(-220);
    } else if (zone.type === 3 && scene.granny.body.blocked.down && now > scene.mechanicCooldown) {
      scene.mechanicCooldown = now + 900;
      scene.granny.setVelocityY(-510);
      sound(scene, "jump");
    } else if (zone.type === 4) {
      scene.granny.setVelocityX(scene.granny.runSpeed + 145);
    } else if (zone.type === 5 && !scene.granny.body.blocked.down) {
      scene.granny.setAccelerationY(-520);
    }
  }
}
