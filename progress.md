# Quality hour — started 15:01, hard stop ~16:05
## Critical defects (from playtest)
- Scene too dark / empty boxes read as prototype
- Floor tiles OK-ish but walls blank, no trim, no detail density
- Water is flat plane, not convincing
- Overlay vignette too aggressive → muddy image
- Footsteps = UI blip (annoying/wrong)
- Interactables hard to spot
- Lighting: point lights don't sell wet aquapark

## Pass order
1. Textures (tile/wall/concrete/metal/normals) — HQ procedural
2. Water realtime shader + caustics
3. Lighting overhaul + tone down overlay
4. World detail: wall tiles, skirting, door frames, signage, denser props
5. Mechanics: footstep SFX, interact glow, collision polish, battery pickup UX
6. Browser playtest → commit → deploy
