import { BootScene } from "./scenes/BootScene.js";
import { MainMenu } from "./scenes/MainMenu.js";
import { LevelSelect } from "./scenes/LevelSelect.js";
import { GameScene } from "./scenes/GameScene.js";
import { CatHouse } from "./scenes/CatHouse.js";
import { Shop } from "./scenes/Shop.js";
import { TrophyRoom } from "./scenes/TrophyRoom.js";

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
      gravity: { y: 1350 },
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
  scene: [BootScene, MainMenu, LevelSelect, GameScene, CatHouse, Shop, TrophyRoom]
};

const game = new Phaser.Game(config);
window.crazyCatGranny = game;
document.querySelector("#loading")?.classList.add("hidden");
