import { PHYSICS_TUNING } from "../config/PhysicsTuning.js";

export class Granny extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "granny-skate", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(12);
    const tuning = PHYSICS_TUNING.player;
    this.setScale(tuning.scale);
    this.setBodySize(180, 350);
    this.setOffset(160, 105);
    this.setCollideWorldBounds(false);
    this.setMaxVelocity(tuning.maxX, tuning.maxY);
    this.setDragX(0);
    this.body.setMass(0.8);
    this.runSpeed = tuning.runSpeed;
    this.airSpin = 0;
    this.isSwinging = false;
    this.hook = null;
    this.swingAngle = 0;
    this.swingRadius = 0;
    this.swingAngularVelocity = 0;
    this.frozen = true;
    this.airKickAvailable = true;
    this.lastGrounded = scene.time.now;
    this.hookBoostUntil = 0;
    this.hookBoostAmount = tuning.hookBoost;
    this.lastHookQuality = 0;
    this.baseScale = tuning.scale;
    this.wasGrounded = false;
    this.skateTime = 0;
    this.airTrickChosen = false;
    this.airTrickActive = false;
    this.airLean = 0;
  }

  stabilizeSkateFrame() {
    // Keep the render anchor and physics body stable across every animation frame.
    // Moving the body offset per frame caused tiny airborne/landing loops and camera shake.
    if (this.displayOriginX !== 256 || this.displayOriginY !== 256) {
      this.setDisplayOrigin(256, 256);
    }
  }

  updateMovement(delta, jumpHeld) {
    if (this.frozen || this.isSwinging) return;
    this.skateTime += delta;
    const tuning = PHYSICS_TUNING.player;
    const startBlend = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp(this.skateTime / tuning.startBlendMs, 0, 1));
    const boostedSpeed = this.scene.time.now < this.hookBoostUntil ? this.runSpeed + this.hookBoostAmount : this.runSpeed;
    const launchSpeed = boostedSpeed * Phaser.Math.Linear(0.72, 1, startBlend);
    this.setVelocityX(Math.max(this.body.velocity.x, launchSpeed));
    const cadence = Phaser.Math.Linear(0.32, 0.82, startBlend);
    this.anims.timeScale = Phaser.Math.Clamp(launchSpeed / this.runSpeed * cadence, 0.28, 1);
    this.play("granny-skating", true);
    this.stabilizeSkateFrame();
    const grounded = this.body.blocked.down || this.body.touching.down;
    if (!grounded) {
      if (this.scene.time.now - this.lastGrounded > 130) {
        this.anims.pause();
        this.setFrame(3);
        this.stabilizeSkateFrame();
      }
      if (!this.airTrickChosen) {
        this.airTrickChosen = true;
        this.airTrickActive = Phaser.Math.Between(0, 99) < 28;
        this.airLean = Phaser.Math.Between(-7, 8);
        this.airSpin = this.angle;
      }
      if (this.airTrickActive) {
        this.airSpin += delta * 0.42;
        this.setAngle(this.airSpin);
      } else {
        const targetLean = this.airLean + (this.body.velocity.y < 0 ? -4 : 5);
        this.setAngle(Phaser.Math.Linear(this.angle, targetLean, 0.12));
      }
      if (jumpHeld && this.body.velocity.y < 40) this.setAccelerationY(tuning.jumpHoldAcceleration);
      else this.setAccelerationY(0);
    } else {
      this.anims.resume();
      if (!this.wasGrounded) this.scene.events.emit("granny-land", Math.abs(this.body.velocity.y));
      this.lastGrounded = this.scene.time.now;
      this.airKickAvailable = true;
      this.airSpin = 0;
      this.airTrickChosen = false;
      this.airTrickActive = false;
      this.setAngle(0);
      this.setAccelerationY(0);
    }
    this.wasGrounded = grounded;
  }

  jump() {
    const grounded = this.body.blocked.down || this.body.touching.down;
    const tuning = PHYSICS_TUNING.player;
    const coyote = this.scene.time.now - this.lastGrounded < tuning.coyoteMs;
    if (!this.frozen && !this.isSwinging && (grounded || coyote)) {
      this.setVelocityY(tuning.jumpVelocity);
      return true;
    }
    if (!this.frozen && !this.isSwinging && this.airKickAvailable) {
      this.airKickAvailable = false;
      this.setVelocityY(tuning.airKickVelocity);
      this.scene.tweens.add({ targets: this, angle: this.angle + 22, duration: 110, ease: "Back.out" });
      return true;
    }
    return false;
  }

  latch(hook) {
    const dx = this.x - hook.x;
    const dy = this.y - hook.y;
    this.hook = hook;
    this.swingRadius = Phaser.Math.Clamp(Math.hypot(dx, dy), 110, 245);
    this.swingAngle = Math.atan2(dy, dx);
    const tangentVelocity = this.body.velocity.x * -Math.sin(this.swingAngle)
      + this.body.velocity.y * Math.cos(this.swingAngle);
    this.swingAngularVelocity = Phaser.Math.Clamp(tangentVelocity / this.swingRadius, -4.4, 4.4);
    this.isSwinging = true;
    this.anims.pause();
    this.setFrame(3);
    this.stabilizeSkateFrame();
    this.body.allowGravity = false;
    this.setVelocity(0, 0);
  }

  swing(delta) {
    if (!this.isSwinging || !this.hook) return;
    let remaining = Math.min(delta / 1000, 0.05);
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 120);
      const gravityTorque = (PHYSICS_TUNING.gravity / this.swingRadius) * Math.cos(this.swingAngle);
      this.swingAngularVelocity += gravityTorque * step;
      this.swingAngularVelocity *= Math.pow(0.997, step * 60);
      this.swingAngularVelocity = Phaser.Math.Clamp(this.swingAngularVelocity, -4.8, 4.8);
      this.swingAngle += this.swingAngularVelocity * step;
      remaining -= step;
    }
    this.x = this.hook.x + Math.cos(this.swingAngle) * this.swingRadius;
    this.y = this.hook.y + Math.sin(this.swingAngle) * this.swingRadius;
    this.setAngle(Phaser.Math.RadToDeg(this.swingAngle) + 10);
  }

  release() {
    if (!this.isSwinging) return false;
    const tangentSpeed = this.swingAngularVelocity * this.swingRadius;
    const rawVelocityX = -Math.sin(this.swingAngle) * tangentSpeed;
    const rawVelocityY = Math.cos(this.swingAngle) * tangentSpeed;
    const quality = Phaser.Math.Clamp(rawVelocityX / this.runSpeed, 0, 1.65);
    this.body.allowGravity = true;
    this.isSwinging = false;
    this.setVelocity(
      Phaser.Math.Clamp(Math.max(this.runSpeed * 0.48, rawVelocityX + 55), 0, 720),
      Phaser.Math.Clamp(rawVelocityY, -760, 760)
    );
    this.hook = null;
    this.lastHookQuality = quality;
    this.hookBoostAmount = 55 + quality * 75;
    this.hookBoostUntil = this.scene.time.now + 850 + quality * 600;
    this.play("granny-skating", true);
    return true;
  }
}
