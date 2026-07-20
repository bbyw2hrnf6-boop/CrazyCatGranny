import { BOSS_DEFINITIONS } from "../src/content/bosses/BossDefinitions.js";
import { CAT_CATALOG } from "../src/content/cats/CatCatalog.js";
import {
  getTotalCatCount,
  getTotalLevelCount,
  getWorldCount
} from "../src/content/GameContentStats.js";
import { LEVELS, WORLDS } from "../src/content/levels/levelRegistry.js";
import { RELEASE_CONFIG } from "../src/config/ReleaseConfig.js";
import { planCourse } from "../src/levels/CoursePlanner.js";
import { storyForLevel } from "../src/content/story/StoryCatalog.js";

const errors = [];
const unique = (values) => new Set(values).size === values.length;
const stories = LEVELS.map(storyForLevel).filter(Boolean);

if (!unique(LEVELS.map((level) => level.id))) errors.push("Level IDs must be unique.");
if (!unique(CAT_CATALOG.map((cat) => cat.id))) errors.push("Cat IDs must be unique.");
if (getTotalLevelCount() !== LEVELS.length) errors.push("Total level count does not match LEVELS.");
if (getTotalCatCount() !== CAT_CATALOG.length) errors.push("Total cat count does not match CAT_CATALOG.");
if (getWorldCount() !== WORLDS.length) errors.push("World count does not match WORLDS.");
if (RELEASE_CONFIG.playableWorlds.length !== WORLDS.length) errors.push("All worlds should be released in full-campaign mode.");
if (RELEASE_CONFIG.playableLevelIds.length !== LEVELS.length) errors.push("All levels should be released in full-campaign mode.");
if (stories.length !== 30) errors.push(`Expected 30 story moments, found ${stories.length}.`);
if (!unique(stories.map((story) => story.id))) errors.push("Story IDs must be unique.");
stories.forEach((story) => {
  if (!story.title || !story.kicker) errors.push(`Story ${story.id} needs a title and kicker.`);
  if (!Array.isArray(story.beats) || story.beats.length < 3) errors.push(`Story ${story.id} needs at least three dialogue beats.`);
  story.beats?.forEach((beat, index) => {
    if (!beat.speaker || !beat.actor || !beat.text) errors.push(`Story ${story.id} beat ${index + 1} is incomplete.`);
  });
});

RELEASE_CONFIG.playableLevelIds.forEach((levelId) => {
  if (!LEVELS.some((level) => level.id === levelId)) errors.push(`Released level ${levelId} does not exist.`);
});

BOSS_DEFINITIONS.forEach((boss) => {
  ["id", "worldId", "title", "color", "projectileTexture", "phasePositions", "weakPointY", "health"].forEach((field) => {
    if (boss[field] === undefined) errors.push(`Boss ${boss.id || "(missing id)"} missing ${field}.`);
  });
  ["bodyParts", "idleAnimation", "attackPattern", "telegraph", "phaseSetPiece"].forEach((field) => {
    if (boss[field] === undefined) errors.push(`Boss ${boss.id || "(missing id)"} missing ${field}.`);
  });
  if (!Array.isArray(boss.bodyParts) || boss.bodyParts.length < 5) errors.push(`Boss ${boss.id} needs richer body parts.`);
  if (!Array.isArray(boss.attackPattern) || boss.attackPattern.length < 2) errors.push(`Boss ${boss.id} needs at least two attacks.`);
  if (!WORLDS.some((world) => world.id === boss.worldId)) errors.push(`Boss ${boss.id} references unknown world ${boss.worldId}.`);
});

LEVELS.filter((level) => level.boss).forEach((level) => {
  if (!BOSS_DEFINITIONS.some((boss) => boss.worldId === level.world)) {
    errors.push(`Boss level ${level.id} has no boss definition for world ${level.world}.`);
  }
});

WORLDS.forEach((world) => {
  const levels = LEVELS.filter((level) => level.world === world.id);
  levels.forEach((level) => {
    const shouldGrantCat = !level.boss && level.worldStep % 2 === 0;
    if (level.grantsCat !== shouldGrantCat) {
      errors.push(`Level ${level.id} has the wrong two-level cat rescue cadence.`);
    }
    if (level.boss && !level.grantsCatBox) errors.push(`Boss level ${level.id} should grant a CatBox.`);
  });
});

LEVELS.forEach((level) => {
  const course = planCourse(level);
  course.obstacles.forEach((obstacle) => {
    const gap = course.gaps.find(([start, end]) => obstacle.x > start - 220 && obstacle.x < end + 300);
    if (gap) {
      errors.push(`Level ${level.id} has obstacle ${Math.round(obstacle.x)} too close to gap ${Math.round(gap[0])}-${Math.round(gap[1])}.`);
    }
  });

  course.gaps.filter(([, , required]) => required).forEach(([start, end]) => {
    const hook = course.hooks.find((point) => point.reason === "gap" && point.required && point.x > start && point.x < end);
    if (!hook) errors.push(`Level ${level.id} has a required grapple gap without a matching hook.`);
  });

  course.hooks.forEach((hook) => {
    if (hook.reason === "gap") {
      const matchingGap = course.gaps.find(([start, end, required]) => required && hook.x > start && hook.x < end);
      if (!matchingGap) errors.push(`Level ${level.id} has a gap hook that is not inside a required gap.`);
      return;
    }

    if (hook.reason === "obstacle") {
      const matchingObstacle = course.obstacles.find((obstacle) => Math.abs(obstacle.x - hook.x) <= 36);
      if (!matchingObstacle) errors.push(`Level ${level.id} has an obstacle hook without a nearby obstacle.`);
      return;
    }

    if (hook.reason === "setpiece") {
      const matchingMoment = course.authoredMoments?.find((moment) => hook.x > moment.x - moment.width / 2 - 80 && hook.x < moment.x + moment.width / 2 + 80);
      if (!matchingMoment) errors.push(`Level ${level.id} has a set-piece hook without an authored moment.`);
      return;
    }

    errors.push(`Level ${level.id} has a hook without a gameplay reason.`);
  });

  course.swingZones.forEach((zone) => {
    course.raised.forEach(([x, , width]) => {
      if (overlaps(x, x + width, zone.start, zone.end)) {
        errors.push(`Level ${level.id} has a raised platform blocking a ${zone.reason} swing zone.`);
      }
    });
    course.awnings.forEach(({ x, width }) => {
      if (overlaps(x, x + width, zone.start, zone.end)) {
        errors.push(`Level ${level.id} has an awning blocking a ${zone.reason} swing zone.`);
      }
    });
  });
});

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Content validation passed: ${LEVELS.length} levels, ${CAT_CATALOG.length} cats, ${BOSS_DEFINITIONS.length} bosses, ${stories.length} story moments.`);

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}
