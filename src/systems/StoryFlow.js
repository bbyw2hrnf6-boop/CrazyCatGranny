import { storyForLevel } from "../content/story/StoryCatalog.js";
import { levelById } from "../levels/levels.js";
import { SaveGame } from "../savegame/SaveGame.js";

export function startLevelWithStory(scene, levelId, options = {}) {
  const level = levelById(levelId);
  const story = options.quickIntro ? null : storyForLevel(level);
  if (story && !SaveGame.hasSeenStory(story.id)) {
    scene.scene.start("StoryScene", { levelId: level.id });
    return;
  }
  scene.scene.start("LevelIntroScene", { levelId: level.id, ...options });
}
