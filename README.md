# PEN WAR — Project Master Reference

> **Purpose of this file:** This is the project handoff and protection document for future AI assistants and developers. Read it before changing code. It records verified repository facts, design goals, constraints, asset locations, build commands, and safe implementation rules.
>
> **Repository:** `iammdtanvirrahman/pen-war-`  
> **Reference branch for this document:** `2.0`  
> **Game identity:** PEN WAR (package name currently `pen-fighter`)  
> **Last documentation update:** 2026-10-29

---

## 1. Non-negotiable rules for future AI agents

Before editing anything, read this section.

1. **Do not rewrite or replace the game.** Make small, focused changes to the existing React + TypeScript + Three.js codebase.
2. **Do not change gameplay physics unless the owner explicitly asks.** In particular, preserve the values in `src/game/constants.ts`, the Cannon-es world setup, collision behavior, pen launch/flick behavior, friction/deceleration, spin, turn handling, and table-edge/fall behavior.
3. **Do not replace the current wooden table.** The current model is `/assets/table/models/gallinera_table_4k.glb`. Preserve its scale, transform, texture mapping, and the tabletop collision/surface alignment.
4. **Do not replace or reposition existing pen models casually.** Main model: `/assets/pens/models/faber-castell_pen.glb`. Preserve the pen-to-physics-body alignment.
5. **Do not break controls, HUD, setup screens, camera controls, orientation guard, AI, or match results.**
6. **Environment additions must be visual-only unless explicitly approved.** Walls, arches, pillars, banners, torches, and decorative props must not interfere with pen/table physics or pointer raycasting.
7. **Keep mobile/tablet performance in mind.** Prefer modular low-poly assets, compressed textures, limited real-time lights/shadows, and no expensive per-frame allocations.
8. **Never invent asset paths.** Confirm the file exists in the repository before referencing it. Keep URL paths consistent with Vite's public asset rules.
9. **Never claim a build or test passed unless it was actually run and its result inspected.**
10. **Do not claim online multiplayer exists unless networking code is found and verified.** The currently verified UI/game modes include friend/local play, AI, and practice. “Multiplayer” may refer to local/pass-and-play unless online networking is implemented elsewhere.
11. Preserve existing licensing notices and document source + license for every third-party model, texture, sound, and font before redistribution.
12. If a request conflicts with these rules, ask the owner before making destructive or gameplay-affecting changes.

### Safe change workflow

- Inspect the current branch and read relevant files before editing.
- Make the smallest possible patch.
- Do not bulk-format or rewrite unrelated files.
- Run `npm run lint` and `npm run build` when the environment supports it.
- Check mobile landscape and tablet framing; inspect the console and asset network requests.
- Report exactly what changed, what was tested, and what remains unverified.

---

## 2. Current verified technology stack

From the current repository's `package.json` and source files:

- React 18
- TypeScript 5
- Vite 6
- Three.js 0.160
- `cannon-es` 0.20 for rigid-body physics
- Tailwind CSS 3
- Lucide React icons
- Capacitor 7 for the Android wrapper
- GitHub Actions workflows for web deployment and Android debug APK build

### Useful commands

Install dependencies:

```bash
npm install
```

Run local development server:

```bash
npm run dev
```

Type-check:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Sync web build to an already configured Capacitor Android project:

```bash
npm run android:sync
```

Open the Android project (requires local Android Studio/SDK):

```bash
npm run android:open
```

Do not run `npx cap add android` if the Android project already exists. The repository README mentions that the `android-app` branch contains the Capacitor configuration/workflow; always inspect the actual target branch before assuming Android files exist there.

---

## 3. Repository architecture

Important source files:

| Path | Responsibility |
|---|---|
| `src/App.tsx` | Main React app, game settings, screen navigation, callbacks and match lifecycle |
| `src/components/GameCanvas.tsx` | Creates and destroys the Three.js game engine and handles resize/orientation events |
| `src/components/Hud.tsx` | In-game HUD |
| `src/components/Controls.tsx` | Game controls UI |
| `src/components/ModeSelectScreen.tsx` | Mode selection |
| `src/components/FormatSelectPage.tsx` | Match format selection |
| `src/components/PlayerCountPage.tsx` | Player-count selection |
| `src/components/PlayerRosterPage.tsx` | Player setup/customization |
| `src/components/SetupModal.tsx`, `MatchSetupModal.tsx` | Setup UI |
| `src/components/PauseMenuModal.tsx` | Pause/menu UI |
| `src/components/ResultModal.tsx` | Match result UI |
| `src/components/RotateDeviceGuard.tsx` | Orientation guard |
| `src/game/PenGameEngine.ts` | Core Three.js scene, camera, asset loading, physics, pen movement, aiming, animation and gameplay |
| `src/game/constants.ts` | Table/pen paths, player colors, pen options and physics/gameplay constants |
| `src/types/game.ts` | Shared game types and interfaces |
| `src/audio/sound.ts` | Audio behavior |
| `src/index.css` | Global styles |
| `src/main.tsx` | React entry point |
| `capacitor.config.ts` | Capacitor app configuration |
| `.github/workflows/pages.yml` | Web deployment workflow |
| `.github/workflows/android-apk.yml` | Android debug APK workflow (verify target branch) |

### Core architectural relationship

- `App.tsx` owns React screens and UI state.
- `GameCanvas.tsx` creates one `PenGameEngine` instance and forwards callbacks.
- `PenGameEngine.ts` owns the Three.js scene and Cannon-es physics world.
- `constants.ts` provides shared asset URLs and tuning values.
- UI/game-engine communication should continue through the existing callbacks and engine methods; do not create a second competing engine or animation loop.

---

## 4. Current game features and verified modes

The repository currently contains UI and code for:

- 3D tabletop pen duel using Three.js
- Cannon-es rigid-body physics
- Drag-to-aim / flick input with power feedback and trajectory guide
- Player turns, pen states, collisions and match finish callbacks
- Friend/local mode, AI mode, and practice mode
- AI difficulty levels: easy, medium, hard
- Single and team match format options in the shared types/UI
- Multiple player/pen configuration options
- Player colors and pen model choices
- Camera orbit controls, auto-rotation, top-view/recenter UI (as wired in current UI)
- Landscape/mobile-oriented presentation and orientation guard
- Sound effects module
- Android packaging workflow on its configured branch

**Important verification note:** Do not assume every UI option is fully implemented or that online multiplayer/network synchronization exists. Verify the current source before describing any feature as complete. Current README/source establish local friend/AI/practice modes; an online networking backend was not confirmed during this documentation pass.

---

## 5. Existing assets — do not break these paths

### Table

- Model: `assets/table/models/gallinera_table_4k.glb`
- Texture directory: `assets/table/textures/`
- Known texture files:
  - `gallinera_table_ao_4k.jpg`
  - `gallinera_table_arm_4k.jpg`
  - `gallinera_table_diff_4k.jpg`
  - `gallinera_table_nor_gl_4k.jpg`
  - `gallinera_table_rough_4k.exr`
- Preview documentation: `assets/table/previews/README.md`
- Asset notes: `assets/table/README.md`

### Pens

- Main GLB: `assets/pens/models/faber-castell_pen.glb`
- Pen preview SVGs include:
  - `assets/pens/previews/faber_castell.svg`
  - `assets/pens/previews/fineliner.svg`
- Pen asset notes: `assets/pens/models/README.md`

### Audio

- Audio documentation exists at `assets/audio/README.md` and `public/assets/audio/README.md`.
- Check the real directory contents before adding or referencing sound files.

### Asset URL rules

The current constants include:

- `TABLE_URL = '/assets/table/models/gallinera_table_4k.glb'`
- `PEN_URL = '/assets/pens/models/faber-castell_pen.glb'`
- `WOOD_URL = '/assets/table/textures/gallinera_table_diff_4k.jpg'`

These URLs resolve from the public asset root in the running Vite app. When adding a new environment asset, confirm whether it belongs under `public/assets/environment/` (recommended for runtime URL loading) and ensure the file is actually present there. There are matching asset documentation folders under both `assets/` and `public/assets/`; avoid accidental duplication of large binary assets.

The table uses several large 4K maps, so consider downscaled mobile versions only as a deliberate, tested optimization. Do not silently change texture paths or remove the EXR file without confirming how the loader uses it.

---

## 6. Physics and gameplay constants — protected area

The following values were read from `src/game/constants.ts` on branch `2.0`. Treat them as a protected baseline; do not tune them as part of visual/environment work.

```ts
export const PEN_MASS = 0.04;
export const TARGET_PEN_LENGTH = 0.72;

export const V_MIN = 0.9;
export const V_MAX = 6.5;
export const MIN_PULL = 0.10;
export const MAX_PULL = 1.3;
export const TABLE_DECEL = 3.8;
export const ROLL_DAMP = 8;
export const FIXED_STEP = 1 / 120;

export const AI_LEVELS = {
  easy: { pool: 4, angle: 0.2, power: 0.28, offset: 0.5 },
  medium: { pool: 2, angle: 0.08, power: 0.12, offset: 0.2 },
  hard: { pool: 1, angle: 0.025, power: 0.05, offset: 0.05 },
};
```

Other protected values include:

- Player colors: Player 1 crimson `#ff4d5e`, Player 2 cyan `#4cc9f0`
- Physics world gravity currently initialized as `(0, -9.82, 0)` in `PenGameEngine.ts`
- Table/pen material and collision setup in `PenGameEngine.ts`
- Table surface dimensions, pen placement, edge/fall checks, aim raycasting and turn resolution in `PenGameEngine.ts`

The constants above are not the entire physics implementation. Do not copy these values into a second config or duplicate physics logic. Keep one source of truth in the existing engine/constants.

---

## 7. Planned visual direction: Medieval Castle Arena

This is a **design target, not yet a claim that the environment has been implemented**.

### Art direction

- Medieval castle chamber with weathered stone walls
- Gothic arches and a small number of stone pillars
- Wall-mounted iron torches with warm amber/orange glow
- Subtle old banners and restrained decorative props
- Stone floor and atmospheric depth
- Dark, cinematic mood while keeping the tabletop and pens clearly visible
- Existing wooden Gallinera table remains the center of the arena
- Existing HUD retains its current visual identity and remains readable

### Camera and composition

- Preserve existing camera controls and the current ability to orbit/top-view/recenter.
- The table must remain the visual focal point.
- In tablet landscape, keep the entire playable tabletop visible and leave UI controls unobstructed.
- Environment geometry should frame the table rather than cover it.
- Use a suitable wall/floor layout around the table; do not add solid collision bodies that can disrupt gameplay.
- Test camera orbit to ensure there are no visible gaps or accidental clipping through the environment.

### Recommended asset plan

Use modular, replaceable assets instead of one huge room mesh:

- `assets/environment/models/`: room shell, wall sections, arches, pillars, torch brackets and optional props
- `assets/environment/textures/`: optimized PBR maps if not embedded in GLB
- `assets/environment/previews/`: screenshots and reference renders
- `assets/environment/README.md`: source, creator, license, dimensions, polygon/texture budget, and integration notes

Runtime-loaded files should be copied/placed under `public/assets/environment/` and loaded using absolute URLs such as `/assets/environment/models/<actual-file-name>.glb`. Replace the placeholder with a real filename only after confirming it exists.

### Mobile performance targets (guidelines, not measured results)

- Prefer modular low-poly models and baked/static lighting where practical.
- Keep real-time shadow casting limited; reuse the existing shadow system rather than adding many shadow maps.
- Use compressed textures (KTX2/Basis when the build pipeline supports it) and avoid shipping unnecessary 4K maps for small props.
- Avoid excessive particles, dynamic point lights, transparent overlays, and high-polygon decorations.
- Do not add a second render loop.
- Dispose of geometries, materials, textures, and event listeners when the environment is removed.
- Measure FPS and memory on actual target devices; do not promise a particular FPS before testing.

### Safe integration design

Preferred implementation boundary:

- Add a dedicated environment module, e.g. `src/game/MedievalCastleEnvironment.ts`, **only after reviewing current engine lifecycle and confirming the chosen architecture**.
- Add environment objects to the existing `THREE.Scene`; keep the table/pen group and physics world independent.
- If a GLB room is used, make sure scale/origin and the floor height match the existing table scene.
- Environment must not intercept game pointer input or change pen raycasting.
- Keep environment setup/cleanup separate from physics updates.
- If asset loading fails, provide a safe fallback so the existing table game can still start.
- Test desktop and mobile/tablet landscape after integration.

---

## 8. UI and visual constraints

- Current UI is dark with crimson and cyan player accents.
- Preserve the existing MENU, sound, player status, TOP and RECENTER interactions as currently wired.
- Do not cover the top HUD with environment art or put game controls inside a baked background image.
- Do not replace interactive UI with a screenshot.
- UI changes must remain responsive in landscape orientation and at tablet widths.
- Keep touch input reliable; do not introduce browser gestures that interfere with drag-to-flick.

---

## 9. Android and deployment notes

- `capacitor.config.ts` currently uses:
  - App ID: `com.tanvir.penwar`
  - App name: `Pen War`
  - Web directory: `dist`
  - Background color: `#050505`
- The current package scripts include `android:sync` and `android:open`.
- The main README documents an Android APK workflow on the `android-app` branch. Verify the branch before running or changing the workflow.
- A debug APK is for testing; it is not automatically a signed Play Store release.
- Always test the app on a real device for touch handling, orientation, asset loading, resume/pause, memory and frame rate.

---

## 10. Licensing and copyright checklist

Before publishing or distributing:

- Record the original creator/source and exact license for the table model, pen models, every environment asset, textures, sounds, and fonts.
- Confirm the license allows the intended commercial use and redistribution in a game.
- Do not assume that AI-generated output or an asset found online is automatically free of restrictions.
- Do not use another game's proprietary models, textures, branding, UI, or sounds without permission.
- Keep attribution/license files where required.
- Review the game's name, logo, store listing, and visual identity for possible trademark conflicts.
- Keep a list of AI tools and prompts used to generate original assets if useful for provenance.
- The table asset's source/license fields in `assets/table/README.md` are currently marked TODO; resolve them before public release.

---

## 11. AI handoff prompt

Copy the following instructions into a new AI coding session along with this repository:

> You are continuing work on the existing PEN WAR repository, branch `2.0`. Read the root `README.md` completely before making changes. Inspect the current source and actual asset tree rather than guessing. The project uses React, TypeScript, Vite, Three.js and cannon-es. Add the planned Medieval Castle visual environment around the existing wooden table, targeting balanced Android phone/tablet landscape performance. Keep the current table model and texture paths, pen models, controls, HUD, camera behavior, modes, turn system, collisions, friction, spin, pen flick behavior and physics constants unchanged. Environment work must be visual-only and must not interfere with gameplay raycasting or collision. Use small modular assets, verified runtime paths under `public/assets/environment/`, safe cleanup, and a fallback if environment assets fail to load. Do not claim online multiplayer or a successful build unless verified. Make the smallest focused patch, run `npm run lint` and `npm run build` if possible, and report changed files plus actual test results. Ask before changing physics, replacing core assets, or making destructive architecture changes.

---

## 12. Current status and known unknowns

- The existing project and core source files listed above are present on branch `2.0`.
- The current table and pen GLB assets are present in the repository.
- `assets/environment/README.md` exists, but this documentation pass did not verify a completed Medieval Castle runtime environment model in the asset tree.
- Medieval Castle is the selected target environment; it is a planned addition, not confirmed implemented.
- Build status was not tested as part of this README update.
- Online multiplayer/network synchronization was not verified.
- Table asset source and license still need to be confirmed.
- Before future changes, re-check the current branch and repository because this document may become stale.

---

## 13. AI Upgrade branch — adaptive on-device learning

Branch `ai-upgrade` adds a small outcome-based learning layer to the existing local AI. It does not use a cloud model, API key, account, or network connection.

- Candidate shot families are scored using prior outcomes, in addition to the existing geometry, edge pressure, collision alignment, and self-risk heuristic.
- After an AI shot settles, the engine records a reward: opponent pens knocked off improve that shot family; the AI losing its own pens or achieving no useful result reduces its reward.
- A compact exponential-moving-average profile is saved under the WebView `localStorage` key `pen-war.ai-learning.v1`, which persists across Android app restarts on the same installation. Clearing app data or uninstalling the app may erase it.
- Memory is bounded to 120 shot families. If storage is unavailable, the game continues and simply skips persistence.
- This is lightweight reinforcement-style adaptation, not a neural network; it learns broad shot patterns from outcomes rather than replaying full match states.

### Validation status

The changes were committed to `ai-upgrade`. A full TypeScript/Vite build and Android device test have **not** been run from this editing session, so run `npm install`, `npm run build`, then `npx cap sync android` before packaging.

## 14. Change log

- **2026-10-29:** Expanded this README into a project master reference and AI handoff guide. Documented verified stack, architecture, assets, protected physics values, Medieval Castle design target, mobile constraints, licensing checks, and verification limits. No gameplay source files were intentionally changed as part of this documentation update.
