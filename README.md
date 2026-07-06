# Crazy Cat Granny

A warm, hand-painted two-button Phaser auto-runner. Skate after the cat thief, jump hazards, swing from cane hooks, collect coins and treats, and bring 45 cats home across five worlds.

Every world contains nine distinct levels and ends in a proper three-phase boss run with weak points, attacks, dodges, and its own world trophy. Later worlds add wind zones, bamboo launch pads, turbo strips, low gravity, weather, neon lights, and longer routes.

All 45 cats use distinct character art. A cat is rescued after each three-level chase; every world boss drops a weighted CatBox with common, uncommon, rare, legendary, and limited cats. Bosses can be replayed to grow the collection.

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

Progress, rescued cats, shop purchases, and best ratings save in browser local storage.

Cat hats are assigned to one selected rescued cat. Cat House furniture is shared by the whole collection. Granny can equip one functional gear item at a time.

Animation and game-feel systems include multi-frame skating and thief run cycles, squash and stretch, physical cane momentum, post-swing speed boosts, camera weight, landing bounce, reactive flowers, debris, weather, particles, and layered parallax. The thief advances independently and can escape; time limits and world-specific fall limits make clean routes and hook boosts important.

## Visual system

Visual content is data-driven:

- `src/visual/VisualCatalog.js` is the single source for asset paths, shop data, cat anchors, wearable fitting, room placement, furniture perches, scale, and layer rules.
- `src/visual/VisualFactory.js` renders the same cat, accessory, gear, furniture, wallpaper, and preview components in every scene.
- Cat accessories inherit the cat’s position, facing direction, rotation, squash, visibility, alpha, depth, and camera scroll factor.
- Room furniture placement and usable cat paths live together, so adding or moving furniture does not require edits across multiple scenes.

To add an item, add its asset and one catalog entry, then list it in save/progression data only if it changes game rules.

## Publish on GitHub Pages

The repository includes a ready-to-run Pages workflow. It builds the Vite app with relative asset paths, so project URLs such as `/CrazyCatGranny/` work correctly.

1. Push the repository to the `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Open the **Actions** tab and watch “Deploy Crazy Cat Granny to GitHub Pages”.

Every later push to `main` rebuilds and publishes the game automatically.
