import { getFirstLevelIdForWorld, getWorldCount } from "../content/GameContentStats.js";
import { LEVELS } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";
import { COLORS, pill, textStyle } from "../ui/ui.js";
import { AdminTestRunner } from "./AdminTestRunner.js";
import { TestReportView } from "./TestReportView.js";

const STATE_KEY = "ccg-admin-test-state";
const REPORT_KEY = "ccg-admin-test-report";

const DEFAULT_STATE = {
  levelId: 1,
  worldId: 1,
  debugFlags: {
    stats: true,
    hitboxes: false,
    grapple: false,
    obstacles: false,
    boss: false
  },
  godMode: false,
  fallDeath: true,
  unlockAll: false,
  testCoins: 150,
  testCats: 1,
  testCatBoxes: 0
};

export class AdminDebugPanel {
  constructor(scene) {
    this.scene = scene;
    this.runner = new AdminTestRunner(scene);
    this.reportView = new TestReportView(scene);
  }

  state() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}");
      return {
        ...DEFAULT_STATE,
        ...saved,
        debugFlags: { ...DEFAULT_STATE.debugFlags, ...(saved.debugFlags || {}) }
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  writeState(state) {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  report() {
    try {
      return JSON.parse(sessionStorage.getItem(REPORT_KEY) || "null");
    } catch {
      return null;
    }
  }

  writeReport(report) {
    sessionStorage.setItem(REPORT_KEY, JSON.stringify(report));
  }

  render(section = "quick") {
    const scene = this.scene;
    const parts = [];
    const tabs = [
      ["quick", "Quick Test"],
      ["levels", "Level Tools"],
      ["debug", "Debug View"],
      ["state", "Test State"],
      ["report", "Test Report"]
    ];
    tabs.forEach(([id, label], index) => {
      const tab = pill(scene, 194 + index * 188, 205, 170, 42, label, {
        fill: section === id ? COLORS.coral : COLORS.cream,
        color: section === id ? "#fff7df" : "#2f2335",
        size: 13
      });
      tab.on("pointerup", () => scene.showAdminSection(id));
      parts.push(tab);
    });
    const lock = pill(scene, 1110, 205, 120, 42, "LOCK", { fill: COLORS.ink, color: "#fff7df", size: 13 });
    lock.on("pointerup", () => {
      sessionStorage.removeItem("ccg-admin-unlocked");
      scene.adminUnlocked = false;
      scene.showPinGate();
    });
    parts.push(lock);
    if (section === "levels") parts.push(...this.renderLevelTools());
    else if (section === "debug") parts.push(...this.renderDebugView());
    else if (section === "state") parts.push(...this.renderTestState());
    else if (section === "report") parts.push(...this.reportView.render(this.report()));
    else parts.push(...this.renderQuickTest());
    return parts;
  }

  renderQuickTest() {
    const scene = this.scene;
    const state = this.state();
    const parts = [
      scene.add.text(640, 265, "Quick Test", textStyle(28, "#2f2335")).setOrigin(0.5),
      scene.add.text(640, 300, "Fast logical checks. No real save writes.", textStyle(15, "#725f72")).setOrigin(0.5)
    ];
    [
      ["Test current level", "current-level", 275, 370],
      ["Test current world", "current-world", 520, 370],
      ["Test boss levels", "boss-levels", 765, 370],
      ["Test full campaign", "full-campaign", 1010, 370],
      ["Analyze placement", "analyze-current", 640, 460]
    ].forEach(([label, scope, x, y]) => {
      const button = pill(scene, x, y, scope === "analyze-current" ? 260 : 215, 62, label, {
        fill: scope === "full-campaign" ? COLORS.yellow : COLORS.cream,
        size: 15
      });
      button.on("pointerup", () => {
        const report = this.runner.run(scope, state);
        this.writeReport(report);
        scene.showAdminSection("report");
      });
      parts.push(button);
    });
    return parts;
  }

  renderLevelTools() {
    const scene = this.scene;
    const state = this.state();
    const level = LEVELS.find((entry) => entry.id === state.levelId) || LEVELS[0];
    const boss = LEVELS.find((entry) => entry.world === state.worldId && entry.boss) || LEVELS.find((entry) => entry.boss);
    const parts = [
      scene.add.text(640, 260, "Level Tools", textStyle(28, "#2f2335")).setOrigin(0.5),
      scene.add.text(640, 296, `Selected Level ${level.id}: ${level.title}`, textStyle(16, "#725f72")).setOrigin(0.5)
    ];
    [
      ["- Level", () => this.setLevel(state.levelId - 1), 255, 360],
      ["+ Level", () => this.setLevel(state.levelId + 1), 455, 360],
      ["Start selected", () => this.startLevel(level.id), 700, 360],
      ["Restart current", () => this.startLevel(level.id), 950, 360],
      ["Previous", () => this.startLevel(Math.max(1, level.id - 1)), 255, 450],
      ["Next", () => this.startLevel(Math.min(LEVELS.length, level.id + 1)), 455, 450],
      ["Start boss", () => this.startLevel(boss.id), 700, 450],
      [state.unlockAll ? "Unlock all: ON" : "Unlock all: OFF", () => this.toggle("unlockAll"), 950, 450]
    ].forEach(([label, action, x, y]) => {
      const button = pill(scene, x, y, 205, 58, label, { fill: COLORS.cream, size: 15 });
      button.on("pointerup", action);
      parts.push(button);
    });
    return parts;
  }

  renderDebugView() {
    const scene = this.scene;
    const state = this.state();
    const flags = [
      ["stats", "Speed/Distance"],
      ["hitboxes", "Hitboxes"],
      ["grapple", "Grapple zones"],
      ["obstacles", "Obstacles"],
      ["boss", "Boss weakpoints"]
    ];
    const parts = [
      scene.add.text(640, 260, "Debug View", textStyle(28, "#2f2335")).setOrigin(0.5),
      scene.add.text(640, 296, "Few useful overlays. Apply by starting a level from here.", textStyle(15, "#725f72")).setOrigin(0.5)
    ];
    flags.forEach(([key, label], index) => {
      const on = Boolean(state.debugFlags[key]);
      const button = pill(scene, 260 + (index % 3) * 310, 365 + Math.floor(index / 3) * 82, 260, 58, `${label}: ${on ? "ON" : "OFF"}`, {
        fill: on ? COLORS.teal : COLORS.cream,
        color: on ? "#fff7df" : "#2f2335",
        size: 14
      });
      button.on("pointerup", () => this.toggleFlag(key));
      parts.push(button);
    });
    const start = pill(scene, 640, 535, 300, 60, "Start with debug", { fill: COLORS.yellow, size: 18 });
    start.on("pointerup", () => this.startLevel(state.levelId));
    parts.push(start);
    return parts;
  }

  renderTestState() {
    const scene = this.scene;
    const state = this.state();
    const parts = [
      scene.add.text(640, 260, "Test State", textStyle(28, "#2f2335")).setOrigin(0.5),
      scene.add.text(640, 296, "Session-only switches. Real save stays protected.", textStyle(15, "#725f72")).setOrigin(0.5)
    ];
    [
      [`God Mode: ${state.godMode ? "ON" : "OFF"}`, () => this.toggle("godMode"), 320, 365],
      [`Fall death: ${state.fallDeath ? "ON" : "OFF"}`, () => this.toggle("fallDeath"), 640, 365],
      ["Apply test save", () => this.applyTestSave(), 960, 365],
      [`Coins ${state.testCoins}`, () => this.bump("testCoins", 100, 0, 9999), 320, 455],
      [`Cats ${state.testCats}`, () => this.bump("testCats", 1, 0, 45), 640, 455],
      [`CatBoxes ${state.testCatBoxes}`, () => this.bump("testCatBoxes", 1, 0, 9), 960, 455],
      [SaveGame.usingTestSave() ? "Test save: ON" : "Test save: OFF", () => this.clearTestSave(), 640, 545]
    ].forEach(([label, action, x, y]) => {
      const button = pill(scene, x, y, 250, 58, label, { fill: COLORS.cream, size: 15 });
      button.on("pointerup", action);
      parts.push(button);
    });
    parts.push(scene.add.text(640, 610, "Normal save protected: test save lives in sessionStorage only.", textStyle(15, "#29997d")).setOrigin(0.5));
    return parts;
  }

  setLevel(levelId) {
    const state = this.state();
    const safe = Math.max(1, Math.min(LEVELS.length, Number(levelId) || 1));
    state.levelId = safe;
    state.worldId = LEVELS.find((level) => level.id === safe)?.world || state.worldId;
    this.writeState(state);
    this.scene.showAdminSection("levels");
  }

  toggle(key) {
    const state = this.state();
    state[key] = !state[key];
    if (key === "unlockAll") sessionStorage.setItem("ccg-admin-unlock-all", state.unlockAll ? "yes" : "no");
    this.writeState(state);
    this.scene.showAdminSection(this.scene.adminSection);
  }

  toggleFlag(key) {
    const state = this.state();
    state.debugFlags[key] = !state.debugFlags[key];
    this.writeState(state);
    this.scene.showAdminSection("debug");
  }

  bump(key, amount, min, max) {
    const state = this.state();
    state[key] = state[key] >= max ? min : Math.min(max, state[key] + amount);
    this.writeState(state);
    this.scene.showAdminSection("state");
  }

  resetState() {
    this.writeState({ ...DEFAULT_STATE });
    sessionStorage.removeItem(REPORT_KEY);
    sessionStorage.removeItem("ccg-admin-unlock-all");
    SaveGame.deactivateTestSave();
    this.scene.showAdminSection("state");
  }

  applyTestSave() {
    const state = this.state();
    const rescuedCats = LEVELS.slice(0, state.testCats).map((level) => level.cat.id);
    const pendingCatBoxes = Array.from({ length: state.testCatBoxes }, (_, index) => ({
      id: `admin-box-${index + 1}`,
      world: Math.max(1, Math.min(getWorldCount(), state.worldId || 1)),
      levelId: getFirstLevelIdForWorld(state.worldId || 1),
      earnedAt: Date.now() + index
    }));
    SaveGame.activateTestSave({
      coins: state.testCoins,
      totalCoins: state.testCoins,
      unlockedLevel: state.unlockAll ? LEVELS.length : state.levelId,
      rescuedCats,
      selectedCat: rescuedCats[0] || null,
      pendingCatBoxes,
      owned: [],
      activeDecor: []
    });
    this.scene.showAdminSection("state");
  }

  clearTestSave() {
    SaveGame.deactivateTestSave();
    this.scene.showAdminSection("state");
  }

  startLevel(levelId) {
    const state = this.state();
    const level = LEVELS.find((entry) => entry.id === Number(levelId)) || LEVELS[0];
    state.levelId = level.id;
    state.worldId = level.world;
    this.writeState(state);
    this.scene.scene.start("GameScene", {
      levelId: level.id,
      adminTest: true,
      skipIntro: true,
      adminTimeScale: 1,
      adminHitboxes: state.debugFlags.hitboxes,
      adminDebugFlags: state.debugFlags,
      adminGodMode: state.godMode,
      adminDisableFallDeath: !state.fallDeath
    });
  }
}
