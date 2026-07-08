# Crazy Cat Granny Flow

## Scene Flow

- `BootScene` preloads assets, creates generated textures and starts cloud sync.
- `MainMenu` is the hub for level select, Cat House, shop, trophies, settings and fullscreen.
- `LevelSelect` chooses a world and level, then starts `LevelIntroScene`.
- `LevelIntroScene` plays the kidnap/chase map beat, with skip support, then starts `GameScene`.
- `GameScene` runs the chase, boss, fall, pause, loss and completion logic.
- `LevelCompleteMapScene` is the active win/reward screen.
- `CatHouse`, `Shop` and `TrophyRoom` are progression side screens.
- `SettingsScene` contains player settings and the PIN-protected admin tools.

## Save Sections

- Progression: levels, paws, trophies, pending CatBoxes, CatBox pity and coin totals.
- Inventory: rescued cats, owned items, equipped gear, hat assignments and accessory edits.
- Layout: active Cat House furniture and furniture transforms.
- Settings: sound.
- Admin test save lives only in `sessionStorage` and does not replace the normal save.

## Active Result Flow

`GameScene.complete()` writes save progress and routes to `LevelCompleteMapScene`.
`ResultsPanel` is legacy UI and should not receive new work unless the result flow is intentionally changed back.

## Manual Smoke Route

1. Main Menu -> Level Select -> Level Intro -> GameScene.
2. Win Level 1 -> LevelCompleteMapScene -> Next.
3. Lose once -> Retry with short intro.
4. Open Cat House -> customize a cat -> apply.
5. Open Shop -> Gear -> edit Granny gear -> equip.
6. Settings -> Admin -> launch a test level -> back arrow returns to admin.
