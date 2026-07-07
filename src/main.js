import { BootScene } from "./scenes/BootScene.js";
import { MainMenu } from "./scenes/MainMenu.js";
import { LevelSelect } from "./scenes/LevelSelect.js";
import { LevelIntroScene } from "./scenes/LevelIntroScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { LevelCompleteMapScene } from "./scenes/LevelCompleteMapScene.js";
import { CatHouse } from "./scenes/CatHouse.js";
import { Shop } from "./scenes/Shop.js";
import { TrophyRoom } from "./scenes/TrophyRoom.js";
import { SettingsScene } from "./scenes/SettingsScene.js";
import { PHYSICS_TUNING } from "./config/PhysicsTuning.js";
import { installFullscreenWatchers } from "./systems/FullscreenManager.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#9fe8ee",
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: PHYSICS_TUNING.gravity },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 4
  },
  scene: [BootScene, MainMenu, LevelSelect, LevelIntroScene, GameScene, LevelCompleteMapScene, CatHouse, Shop, TrophyRoom, SettingsScene]
};

const game = new Phaser.Game(config);
window.crazyCatGranny = game;
installFullscreenWatchers(game);
document.querySelector("#loading")?.classList.add("hidden");
