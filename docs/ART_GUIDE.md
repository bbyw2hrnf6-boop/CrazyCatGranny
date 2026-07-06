# Crazy Cat Granny Art Guide

All production art follows one warm, hand-painted 2D language.

- Canvas: 1280×720 internal resolution. Assets are authored at 2× and downscaled.
- Line: deep plum `#2f2335`, rounded ends, 4–6 px at gameplay size.
- Light: warm upper-left key light. One soft lower-right contact shadow.
- Palette: cream, coral, teal and sunflower accents; avoid pure black and pure white.
- Perspective: side-on gameplay uses a shallow three-quarter view. Cat House furniture shares the room floor plane.
- Shape: broad readable silhouettes first, surface detail second.
- Animation: gameplay cycles target 8–12 fps with eased secondary motion; UI uses 100–180 ms responses.
- Accessories: attach through catalog anchors, inherit cat scale/flip/rotation, and never use screen-space offsets.
- Furniture: one image, one footprint, interaction perches, walk paths and editable transform metadata.
- UI: cream paper panels, plum outlines, soft offset shadow, rounded geometry, Baloo 2 typography.

New assets are registered in `VisualCatalog.js` and created through `VisualFactory.js`. Scene code must not invent a second visual style.
