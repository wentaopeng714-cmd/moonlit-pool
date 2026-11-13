# 染池 · Chromatic Bath

A little color playground for the browser. Design a bath bomb, drop it into the pool, and drag through the water to stir the pigments.

## Play

https://wentaopeng714-cmd.github.io/moonlit-pool/

## Customize

- Six starting recipes and three independently editable colors.
- Four shapes, five patterns, glitter and floating contents.
- Pigment concentration from 20% to 400%, dissolution speed and foam controls.
- Save up to 12 recipes in this browser.
- Moonlight, dusk and daylight; overhead view, cinematic camera and PNG export.

Click or tap the water to drop a bomb. Drag to stir. Use the recipe workbench to customize the next bomb. On a phone, tap **调配香丸** to open the editor.

Keyboard: Space — drop, O — overhead, C — cinematic camera, P — save PNG, H — hide interface.

## Run locally

```sh
python3 -m http.server 8765
```

Then open http://localhost:8765 . WebGL 2 and floating-point render targets are required. Three.js and its required addons are included in `vendor/`; the optional web font falls back to system fonts.

## Credits and license

This is a remix of [Techartist’s bath-bomb-builder](https://github.com/iamtechartist/bath-bomb-builder), used under the MIT License. The original GPU fluid simulation, bath geometry, materials, effects, and procedural audio form the foundation. This remix adds a Chinese recipe workbench, independently editable colors, per-bomb concentration/speed/foam controls, local recipe storage, a moonlit garden scene and revised pigment rendering.

Original project: Copyright (c) 2026 Techartist. See [LICENSE](LICENSE).

Three.js: Copyright 2010–2026 Three.js Authors. See [vendor/LICENSE](vendor/LICENSE).

## Front camera gestures

Click the camera icon labeled **手势** and allow camera access. Phones request the front-facing camera; desktop browsers use an available webcam. The mirrored preview stays visible alongside the pool. Move your index finger to stir and pinch your thumb and index finger to drop a bath bomb. Open the pinch to drop again. Click × to release the camera. Touch and mouse controls work without a camera.

Camera access requires HTTPS or localhost. The camera is off by default. Video frames and hand landmarks are processed locally, with no recording or upload. The [MediaPipe Hand Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker?tab=Web) runtime (0.10.21) and model (Hand Landmarker float16, v1) are loaded only when the camera is enabled and distributed under [Apache 2.0](vendor/mediapipe/LICENSE).

With the camera on, raise your index finger until **手势选项** is highlighted and pinch to open the menu. Move the finger to highlight a tile and pinch again to select a palette, shape, pattern, glitter, contents, lighting, or view. The menu also accepts clicks and taps. The full recipe editor remains available.
