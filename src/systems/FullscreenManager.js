const LANDSCAPE_REQUIRED_CLASS = "ccg-landscape-required";

function gameShell() {
  return document.querySelector("#game-shell") || document.documentElement;
}

export function isMobileDevice() {
  return matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

export function isFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function setLandscapeRequired(required) {
  document.body.classList.toggle(LANDSCAPE_REQUIRED_CLASS, Boolean(required));
  updateOrientationHint();
}

export function updateOrientationHint() {
  const shouldShow = document.body.classList.contains(LANDSCAPE_REQUIRED_CLASS)
    && isMobileDevice()
    && isPortrait();
  document.querySelector("#rotate-hint")?.classList.toggle("visible", shouldShow);
}

async function requestFullscreenElement() {
  const target = gameShell();
  if (document.fullscreenElement || document.webkitFullscreenElement) return true;
  if (target.requestFullscreen) {
    await target.requestFullscreen({ navigationUI: "hide" });
    return true;
  }
  if (target.webkitRequestFullscreen) {
    target.webkitRequestFullscreen();
    return true;
  }
  return false;
}

async function exitFullscreenElement() {
  if (document.exitFullscreen && document.fullscreenElement) {
    await document.exitFullscreen();
    return true;
  }
  if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
    document.webkitExitFullscreen();
    return true;
  }
  return false;
}

async function lockLandscapeIfPossible() {
  if (!isMobileDevice()) return false;
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock("landscape");
      return true;
    }
  } catch {
    // Many iOS/mobile browsers only allow the visual rotate hint, not a real lock.
  }
  return false;
}

export async function enterFullscreen(scene, options = {}) {
  const preferLandscape = options.landscape ?? isMobileDevice();
  setLandscapeRequired(preferLandscape);
  try {
    await requestFullscreenElement();
    if (preferLandscape) await lockLandscapeIfPossible();
  } finally {
    updateOrientationHint();
    scene?.scale?.refresh();
    setTimeout(() => scene?.scale?.refresh(), 250);
  }
}

export async function leaveFullscreen(scene) {
  setLandscapeRequired(false);
  try {
    if (screen.orientation?.unlock) screen.orientation.unlock();
  } catch {
    // Safe ignore: orientation unlock is optional.
  }
  await exitFullscreenElement();
  updateOrientationHint();
  scene?.scale?.refresh();
}

export async function toggleFullscreen(scene) {
  if (isFullscreen()) return leaveFullscreen(scene);
  return enterFullscreen(scene, { landscape: isMobileDevice() });
}

export function installFullscreenWatchers(game) {
  const refresh = () => {
    updateOrientationHint();
    game?.scale?.refresh();
  };
  window.addEventListener("resize", refresh);
  window.addEventListener("orientationchange", () => setTimeout(refresh, 200));
  document.addEventListener("fullscreenchange", refresh);
  document.addEventListener("webkitfullscreenchange", refresh);
  refresh();
}
