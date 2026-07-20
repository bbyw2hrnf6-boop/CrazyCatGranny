# Crazy Cat Granny

A warm, hand-painted two-button Phaser auto-runner. Skate after the cat thief, jump hazards, swing from cane hooks, collect coins and treats, and bring 45 cats home across five worlds.

The current release runs as a full campaign: all five worlds and all 45 levels are playable. `src/config/ReleaseConfig.js` is still the single release gate if a smaller build is needed later.

Every world contains nine distinct levels and ends in a proper three-phase boss run with weak points, attacks, dodges, and its own world trophy. Later worlds add wind zones, bamboo launch pads, turbo strips, low gravity, weather, neon lights, and longer routes.

The campaign includes 30 animated story moments: five world openings, twenty cat-rescue chapters, and five boss confrontations. Cinematics use the live character art, camera movement, type-on dialogue, autoplay, touch/keyboard advance, and a skip control. Watched scenes are tracked in the save so replays return to the chase quickly.

All 45 cats are in the campaign. Cats are rescued after two-level chase chapters and each boss grants one weighted CatBox on its first clear.

Rescued cats share a living Cat House where they wander, eat, drink, sleep, play, socialize, watch fish, climb real furniture paths, and meow. The room uses an empty 3D-style architectural shell with separately layered interactive furniture, so visible cat trees, bridges, beds, and seats are usable rather than baked into the background.

## Run

Use Vite when Node.js is installed:

```bash
npm install
npm run dev
```

Before pushing, run the full local safety check:

```bash
npm run check
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
- Fullscreen: press `⛶` in the main menu, settings, or in-game HUD. Mobile fullscreen requests landscape mode and shows a rotate prompt if the browser cannot lock orientation.
- Settings: use the small gear on the main menu.
- Admin tools: open the Admin tab in Settings and enter PIN `1702`.

Progress, rescued cats, shop purchases, and best ratings save in browser local storage.
Save data is versioned, migrated from the old flat format, split into progression/inventory/layout/settings sections, and backed up before every write.

Cat hats are assigned to one selected rescued cat. Cat House furniture is shared by the whole collection. Granny can equip one functional gear item at a time.

Animation and game-feel systems include multi-frame skating and thief run cycles, signed pendulum cane physics, release-timing momentum, post-swing speed lines, camera weight, render-safe landing feedback, reactive flowers, pooled debris, weather, particles, and layered parallax. The thief advances independently, reacts to Granny, avoids course hazards, and can escape.

## Technical structure

- `src/config/ReleaseConfig.js` controls which worlds and levels are playable in a given build.
- `src/config/PhysicsTuning.js` is the single movement and camera tuning source.
- `src/levels/CoursePlanner.js` creates reusable, data-driven gaps, hooks, routes, obstacles, coins, and bounce platforms.
- `src/systems/PerformanceProfile.js` selects high or balanced effects automatically from device capability, reduced-motion preferences, and the optional `?quality=high|low` debug flag.
- `src/systems/DevTools.js` provides `F1` telemetry, `F2` hitboxes, `F3` slow motion, and `F4` segment skipping.
- The PIN-protected Admin panel launches normal, slow-motion and hitbox tests, manages backups, and resets progression, room layout, settings, or the full save separately.
- Scene/save flow is documented in [`docs/FLOW.md`](docs/FLOW.md).
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
