# Crazy Cat Granny

A warm, hand-painted two-button Phaser auto-runner. Skate after the cat thief, jump hazards, swing from cane hooks, collect coins and treats, and bring 45 cats home across five worlds.

Every world contains nine distinct levels and ends in a proper three-phase boss run with weak points, attacks, dodges, and its own world trophy. Later worlds add wind zones, bamboo launch pads, turbo strips, low gravity, weather, neon lights, and longer routes.

All 45 cats use distinct character art. Rescued cats share a living Cat House where they wander, eat, sleep, play, socialize, meow, and can be customized individually. Purchased room furniture can be placed or returned to storage with the room editor.

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

Animation and game-feel systems include multi-frame skating and thief run cycles, squash and stretch, physical cane momentum, post-swing speed boosts, camera weight, landing bounce, reactive flowers, debris, weather, particles, and layered parallax.
