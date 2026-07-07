# Crazy Cat Granny

A warm, hand-painted two-button Phaser auto-runner. Skate after the cat thief, jump hazards, swing from cane hooks, collect coins and treats, and bring 45 cats home across five worlds.

The current release runs as a focused vertical slice: all World 1 levels 1–9 are playable, including the boss. Worlds 2–5 remain visible as locked future content. Change `src/config/ReleaseConfig.js` to release more completed content without deleting or duplicating its code.

Every world contains nine distinct levels and ends in a proper three-phase boss run with weak points, attacks, dodges, and its own world trophy. Later worlds add wind zones, bamboo launch pads, turbo strips, low gravity, weather, neon lights, and longer routes.

All 45 cats remain in the project. The focused release exposes the World 1 cats; cats are rescued after three-level chase chapters and the boss grants one weighted CatBox on its first clear. Future cats unlock with their parked worlds.

Rescued cats share a living Cat House where they wander, eat, drink, sleep, play, socialize, watch fish, climb real furniture paths, and meow. The room uses an empty 3D-style architectural shell with separately layered interactive furniture, so visible cat trees, bridges, beds, and seats are usable rather than baked into the background.

## Run

Use Vite when Node.js is installed:

```bash
npm install
npm run dev
```

The project also runs without a build step:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. Phaser loads from jsDelivr.

## Controls

- Jump / air-kick: `Space` or `↑`, or the on-screen Jump button
- Cane: hold `Shift` or `A`, or the on-screen Cane button
- Pause: `Esc`
- Settings: use the small gear on the main menu.
- Admin tools: open the Admin tab in Settings and enter PIN `1702`.

Progress, rescued cats, shop purchases, and best ratings save in browser local storage.
Save data is versioned, migrated from the old flat format, split into progression/inventory/layout/settings sections, and backed up before every write.

Cat hats are assigned to one selected rescued cat. Cat House furniture is shared by the whole collection. Granny can equip one functional gear item at a time.

Animation and game-feel systems include multi-frame skating and thief run cycles, signed pendulum cane physics, release-timing momentum, post-swing speed lines, camera weight, render-safe landing feedback, reactive flowers, pooled debris, weather, particles, and layered parallax. The thief advances independently, reacts to Granny, avoids course hazards, and can escape.

## Technical structure

- `src/config/ReleaseConfig.js` controls the small public slice without deleting future content.
- `src/config/PhysicsTuning.js` is the single movement and camera tuning source.
- `src/levels/CoursePlanner.js` creates reusable, data-driven gaps, hooks, routes, obstacles, coins, and bounce platforms.
- `src/systems/PerformanceProfile.js` selects high or balanced effects. The main menu also offers a manual quality mode.
- `src/systems/DevTools.js` provides `F1` telemetry, `F2` hitboxes, `F3` slow motion, and `F4` segment skipping.
- The PIN-protected Admin panel launches normal, slow-motion and hitbox tests, manages backups, and resets progression, room layout, settings, or the full save separately.
- Physics for distant collectibles is disabled until it is relevant, while frequently used dust and landing debris are pooled.

## Visual system

Visual content is data-driven:

- `src/visual/VisualCatalog.js` is the single source for asset paths, shop data, cat anchors, wearable fitting, room placement, furniture perches, scale, and layer rules.
- `src/visual/VisualFactory.js` renders the same cat, accessory, gear, furniture, wallpaper, and preview components in every scene.
- Cat accessories inherit the cat’s position, facing direction, rotation, squash, visibility, alpha, depth, and camera scroll factor.
- Room furniture can be dragged anywhere in the usable room, rotated, flipped, and resized from 55% to 160%. Done commits the draft layout to the save game.
- Furniture transforms and usable cat paths live together. Saving a moved or turned item rebuilds its interaction points, and cats use explicit walk and jump waypoints instead of flying to it.

To add an item, add its asset and one catalog entry, then list it in save/progression data only if it changes game rules.

New visuals must follow [`docs/ART_GUIDE.md`](docs/ART_GUIDE.md).

## Publish on GitHub Pages

The repository includes a ready-to-run Pages workflow. It builds the Vite app with relative asset paths, so project URLs such as `/CrazyCatGranny/` work correctly.

1. Push the repository to the `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Open the **Actions** tab and watch “Deploy Crazy Cat Granny to GitHub Pages”.

Every later push to `main` rebuilds and publishes the game automatically.
