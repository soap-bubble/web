## `packages/www` (morpheus-next) — Agent Notes

Next.js (App Router) frontend for Morpheus. This package also contains the local WebSocket broker + MCP server used for agent-controlled testing.

### Commands (from repo root)

- **Dev (custom server + WS broker for MCP)**: `yarn workspace morpheus-next dev`
- **Dev (plain Next dev server)**: `yarn workspace morpheus-next dev:next`
- **Build**: `yarn workspace morpheus-next build`

Notes:
- Node is expected to be **>= 24** (see repo root `AGENTS.md`).
- The MCP/WebSocket broker is **local-dev only** (production deploys won’t have the WS broker).

### WebSocket game-control broker (local dev)

- Implemented in `packages/www/server.ts`
- WebSocket endpoint: `ws://localhost:3000/api/game-control`
- Clients identify themselves via query params:
  - **Browser**: `?client=browser`
  - **MCP**: `?client=mcp&session=<id>`

The browser typically chooses the session name via the scene URL query param:
- `/scene/1050?mcp=mySessionName`

Hotspot click control is browser-authoritative:
- `morpheus_click_hotspot` sends an exact hotspot selector to the connected browser and waits for a browser-reported result.
- Static map data is only candidate discovery; active scene identity and gamestate eligibility are decided by the browser.
- `morpheus_rotate_to_hotspot` is a viewing helper, not evidence that a click occurred.
- Direct `morpheus_load_scene` remains available for explicit scene loads, but hotspot click helpers should not use it as a shortcut.

Living-save diagnostics are read-only and bounded:

- `morpheus_get_current_state` includes the active slot, catalog revision, three fixed slot summaries, resume-point identity, save health, and bounded failure/unloadable reasons.
- It must not expose complete gamestate maps, save envelopes, imported/exported file bytes, or add save-management tools.
- Slot selection, load, delete, Undo, import, and export remain browser-UI behaviors so MCP acceptance checks exercise the same player path.

### App Router entry points

- **Root layout**: `src/app/layout.tsx` wraps the app in `src/app/providers.tsx`
- **Scene route**: `src/app/scene/[sceneId]/page.tsx`
- **Scene “runtime shell”**: `src/app/scene/stage-shell.tsx` (client component; renders `InteractiveStage`, handles transitions, WS status HUD in dev)
- **Scene layout**: `src/app/scene/layout.tsx` (mounts `SceneStageShell` alongside child route content)

### State management

There are two “stores” in this package:

#### 1) Preferred: Redux Toolkit store for the App Router (`src/morpheus-app/store/`)

- **Store**: `src/morpheus-app/store/store.ts`
- **Typed hooks**: `src/morpheus-app/store/hooks.ts`
- **Provider wiring**: `src/app/providers.tsx` → used by `src/app/layout.tsx`

Current slices:
- **Scene**: `src/morpheus-app/store/slices/sceneSlice.ts`
  - `byId`: scene cache
  - `stack`: small LRU-ish stage stack (active + background scenes)
  - `activeSceneId`
  - `loadScene`: async thunk to fetch a scene when missing
  - selectors: `selectSceneById`, `selectStageScenes`, `selectActiveSceneId`
- **Rotation**: `src/morpheus-app/store/slices/rotationSlice.ts`
  - `current`: `{ yaw3600, pitch }`
  - `seededFromTransition`: one-shot seed flag for scene transitions
  - selectors: `selectRotation`, `selectRotationSeeded`

How to use in components:
- Prefer `useAppDispatch()` and `useAppSelector(...)` from `src/morpheus-app/store/hooks.ts`
- Keep selectors **pure** and co-locate them with the slice when possible
- For derived data, prefer `createSelector` (already used in `sceneSlice.ts`)

Where it’s used today:
- `src/app/scene/stage-shell.tsx` drives transitions + rotation via slice actions/selectors.
- `src/morpheus-app/systems/useSceneSystem.ts` is a hook-style integration point that initializes/prefetches scenes and exposes `stageScenes`.

Adding a new slice (pattern):
- Create `src/morpheus-app/store/slices/<thing>Slice.ts`
- Export slice reducer + actions + selectors
- Add the reducer to `configureStore({ reducer: { ... } })` in `src/morpheus-app/store/store.ts`
- Use typed hooks throughout UI code (no untyped `useDispatch`/`useSelector`)

#### 2) Legacy: older Redux store (`src/store/`)

`src/store/index.ts` is a pre-RTK store with `redux-observable` + `redux-thunk` and some legacy typing. Treat it as **legacy** unless you are explicitly working on old codepaths (e.g. `src/morpheus-app/app.tsx` / `src/app.jsx`).

If you’re implementing new App Router behavior/state, prefer extending the **Redux Toolkit** store in `src/morpheus-app/store/` instead of adding more surface area to `src/store/`.

### TypeScript/React conventions (this package)

- Use **functional React** with explicit `react` imports (hooks/types).
- Keep types strict: avoid `as any` / unsafe casts.
- If a value is `unknown`, narrow it with safe runtime checks before using it.
