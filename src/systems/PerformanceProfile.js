export function performanceProfile(preference = "auto") {
  const params = new URLSearchParams(globalThis.location?.search || "");
  const forced = params.get("quality");
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const weakDevice = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const mode = forced === "high" || (!forced && preference === "high")
    ? "high"
    : forced === "low" || (!forced && preference === "balanced") || reducedMotion || weakDevice
      ? "balanced"
      : "high";
  return Object.freeze({
    mode,
    dustInterval: mode === "balanced" ? 210 : 135,
    landingDebris: mode === "balanced" ? 3 : 6,
    bossSparks: mode === "balanced" ? 7 : 14,
    rainDrops: mode === "balanced" ? 14 : 28,
    ambientPropsStep: mode === "balanced" ? 1100 : 780,
    offscreenPhysicsInterval: 320
  });
}
