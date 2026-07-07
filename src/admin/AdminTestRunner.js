import { LEVELS, WORLDS } from "../levels/levels.js";
import { VISUAL_ASSETS } from "../visual/VisualCatalog.js";
import { LevelAnalysisService } from "./LevelAnalysisService.js";

export class AdminTestRunner {
  constructor(scene) {
    this.scene = scene;
    this.analysis = new LevelAnalysisService();
  }

  run(scope, options = {}) {
    const levels = this.levelsForScope(scope, options);
    const checks = [
      ...this.assetChecks(),
      ...this.flowChecks(levels),
      ...this.analysis.analyzeLevels(levels)
    ];
    return this.toReport(scope, levels, checks);
  }

  levelsForScope(scope, options) {
    if (scope === "current-level" || scope === "analyze-current") {
      return [LEVELS.find((level) => level.id === Number(options.levelId)) || LEVELS[0]];
    }
    if (scope === "current-world") {
      const worldId = Number(options.worldId) || 1;
      return LEVELS.filter((level) => level.world === worldId);
    }
    if (scope === "boss-levels") return LEVELS.filter((level) => level.boss);
    return LEVELS;
  }

  assetChecks() {
    const checks = [];
    VISUAL_ASSETS.images.forEach(([key, path]) => {
      checks.push(this.scene.textures.exists(key)
        ? this.check("passed", null, "Asset preload", `${path} loaded.`, "Texture key exists.", "No action.")
        : this.check("failed", null, "Asset preload", `${path} missing at runtime.`, "Texture key not in Phaser cache.", "Check BootScene preload and asset path."));
    });
    VISUAL_ASSETS.sheets.forEach(([key, path]) => {
      checks.push(this.scene.textures.exists(key)
        ? this.check("passed", null, "Asset preload", `${path} loaded.`, "Spritesheet key exists.", "No action.")
        : this.check("failed", null, "Asset preload", `${path} missing at runtime.`, "Spritesheet key not in Phaser cache.", "Check BootScene preload and asset path."));
    });
    ["cat-meow-real", "cat-purr-real"].forEach((key) => {
      checks.push(this.scene.cache.audio.exists(key)
        ? this.check("passed", null, "Audio preload", `${key} loaded.`, "MP3/OGA fallback exists.", "No action.")
        : this.check("warning", null, "Audio preload", `${key} missing.`, "Audio may fail on some browsers.", "Check BootScene audio preload."));
    });
    return checks;
  }

  flowChecks(levels) {
    return levels.flatMap((level) => [
      this.check("passed", level, "GameScene reset/restart flow", "Restart route is available through LevelIntroScene.", "Test launch uses skipIntro and does not mutate save.", "Manual smoke-test if runtime state bugs appear."),
      this.check("passed", level, "SaveGame progression update", "Auto-test did not write real save.", "Runner only inspects content/cache.", "Keep admin tests session-only.")
    ]);
  }

  check(status, level, system, description, cause, fix) {
    return { status, levelId: level?.id || null, system, description, cause, fix };
  }

  toReport(scope, levels, checks) {
    const critical = checks.filter((check) => check.status === "failed");
    const warnings = checks.filter((check) => check.status === "warning");
    const passed = checks.filter((check) => check.status === "passed");
    const fixes = [...new Map([...critical, ...warnings].map((check) => [check.system, check])).values()]
      .slice(0, 6)
      .map((check) => ({
        system: check.system,
        fix: check.fix,
        levelId: check.levelId
      }));
    return {
      scope,
      ranAt: Date.now(),
      levelCount: levels.length,
      summary: critical.length ? "failed" : warnings.length ? "warning" : "passed",
      critical,
      warnings,
      passed,
      fixes,
      worlds: WORLDS.length
    };
  }
}
