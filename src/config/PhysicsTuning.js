export const PHYSICS_TUNING = Object.freeze({
  gravity: 1350,
  player: Object.freeze({
    scale: 0.29,
    runSpeed: 315,
    maxX: 720,
    maxY: 920,
    jumpVelocity: -595,
    airKickVelocity: -455,
    jumpHoldAcceleration: -540,
    coyoteMs: 145,
    startBlendMs: 1450,
    hookBoost: 125,
    hookBoostMs: 1800
  }),
  camera: Object.freeze({
    lerpX: 0.1,
    lerpY: 0.09,
    followOffsetX: -260,
    followOffsetY: 58,
    deadzoneWidth: 165,
    deadzoneHeight: 95
  })
});
