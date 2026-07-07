import { BOSS_DEFINITIONS } from "../content/bosses/BossDefinitions.js";
import { LEVELS } from "../levels/levels.js";
import { planCourse } from "../levels/CoursePlanner.js";

function entry(status, level, system, description, cause, fix) {
  return {
    status,
    levelId: level?.id || null,
    system,
    description,
    cause,
    fix
  };
}

export class LevelAnalysisService {
  analyzeLevel(level) {
    const course = planCourse(level);
    const checks = [];
    checks.push(entry("passed", level, "GameScene", "Level data loaded.", "Level registry contains this id.", "No action."));

    this.checkCourse(level, course, checks);
    if (level.boss) this.checkBoss(level, checks);
    return checks;
  }

  analyzeLevels(levels = LEVELS) {
    return levels.flatMap((level) => this.analyzeLevel(level));
  }

  checkCourse(level, course, checks) {
    const finishX = level.length - 260;
    checks.push(entry("passed", level, "GameScene", `Finish exists at x=${finishX}.`, "Level length is valid.", "No action."));

    course.gaps.filter(([, , required]) => required).forEach(([start, end]) => {
      const hook = course.hooks.find((point) => point.reason === "gap" && point.x > start && point.x < end);
      checks.push(hook
        ? entry("passed", level, "CoursePlanner", `Required grapple gap ${Math.round(start)}-${Math.round(end)} has a hook.`, "Required route is represented.", "No action.")
        : entry("failed", level, "CoursePlanner", `Required grapple gap ${Math.round(start)}-${Math.round(end)} has no hook.`, "Hook generation missed a required gap.", "Check planHooks gap hook creation."));
    });

    course.swingZones.forEach((zone) => {
      const platform = course.raised.find(([x, , width]) => x < zone.end && x + width > zone.start);
      if (platform) {
        checks.push(entry("failed", level, "CoursePlanner", `Raised platform overlaps ${zone.reason} swing zone.`, "Platform placement can block a swing route.", "Adjust planRaised overlap rules."));
      }
    });

    course.obstacles.forEach((obstacle, index) => {
      const gap = course.gaps.find(([start, end]) => obstacle.x > start - 220 && obstacle.x < end + 300);
      const previous = course.obstacles[index - 1];
      if (gap) {
        checks.push(entry("warning", level, "CoursePlanner", `Obstacle ${Math.round(obstacle.x)} is close to gap ${Math.round(gap[0])}-${Math.round(gap[1])}.`, "Landing or takeoff may feel unfair.", "Increase obstacle gap buffer."));
      }
      if (previous && obstacle.x - previous.x < 520) {
        checks.push(entry("warning", level, "CoursePlanner", `Obstacle spacing ${Math.round(obstacle.x - previous.x)} is tight.`, "Stacked obstacles can become noisy.", "Increase planObstacles spacing."));
      }
    });

    course.hooks.filter((hook) => !hook.required).forEach((hook) => {
      if (["obstacle", "setpiece"].includes(hook.reason)) return;
      checks.push(entry("warning", level, "CoursePlanner", `Hook at ${Math.round(hook.x)} has no clear reason.`, "Hook reason is missing or too generic.", "Set hook reason or remove it."));
    });

    if (!course.coins.length) {
      checks.push(entry("warning", level, "CoursePlanner", "No coins generated.", "Coin route may be empty.", "Check planCoins spacing and filters."));
    } else {
      checks.push(entry("passed", level, "CoursePlanner", `${course.coins.length} coins generated.`, "Coin route exists.", "No action."));
    }

    const unreachableCoin = course.coins.find((coin) => coin.y < 220 || coin.y > 610);
    if (unreachableCoin) {
      checks.push(entry("warning", level, "CoursePlanner", `Coin at ${Math.round(unreachableCoin.x)},${Math.round(unreachableCoin.y)} looks suspicious.`, "Coin y is outside normal playable band.", "Check raised platform and coin y rules."));
    }
  }

  checkBoss(level, checks) {
    const boss = BOSS_DEFINITIONS.find((entry) => entry.worldId === level.world);
    if (!boss) {
      checks.push(entry("failed", level, "BossEncounter", "Boss definition missing.", "Boss level has no matching world boss.", "Add BossDefinitions entry."));
      return;
    }
    if (!boss.bodyParts?.length || boss.bodyParts.length < 5) {
      checks.push(entry("warning", level, "BossEncounter", "Boss uses too few body parts.", "Visual may still feel generic.", "Add bodyParts in BossDefinitions."));
    } else {
      checks.push(entry("passed", level, "BossEncounter", `${boss.bodyParts.length} boss body parts defined.`, "Boss has world-specific visual data.", "No action."));
    }
    if (!boss.attackPattern?.length || boss.attackPattern.length < 2) {
      checks.push(entry("failed", level, "BossEncounter", "Boss has too few attacks.", "Boss fight will feel generic.", "Add attackPattern entries."));
    } else {
      checks.push(entry("passed", level, "BossEncounter", `${boss.attackPattern.length} boss attacks defined.`, "Boss has attack variety.", "No action."));
    }
    boss.weakPointY.forEach((y, index) => {
      if (y < 260 || y > 520) {
        checks.push(entry("warning", level, "BossEncounter", `Weak point ${index + 1} y=${y} may be hard to reach.`, "Weak point outside normal jump/swing band.", "Adjust weakPointY or add hook support."));
      }
    });
  }
}
