## Hotspot System Plan

### Goals
- Use Redux Toolkit as the canonical source for hotspot interaction state.
- Keep Three.js raycast logic and DOM event handling in a systems layer.
- Keep gamestate updates and scene transitions in serializable Redux actions.

### Inputs (runtime)
- Pointer events (screen coords, button state)
- Active scene and scene stack
- Pano raycast results (UV -> game coords)

### Outputs (Redux actions)
- `hotspotHovered({ castId, sceneId })`
- `hotspotPressed({ castId, sceneId, position })`
- `hotspotClicked({ castId, sceneId, position })`
- `hotspotReleased({ castId, sceneId, position })`

### Core flow
1. `useHotspotSystem` subscribes to pointer events and raycasts against the pano mesh.
2. The system computes game-space coordinates using the same UV math as legacy:
   - `packages/morpheus/client/js/morpheus/casts/hooks/useInputHandler.ts`
3. The system resolves matching hotspots from the active scene casts:
   - `packages/morpheus/client/js/morpheus/casts/modules/hotspot.js`
4. The system dispatches `hotspotClicked` when the pointer interaction qualifies.
5. A listener middleware maps `hotspotClicked` to gamestate actions:
   - Port logic from `packages/morpheus/client/js/morpheus/gamestate/actions.ts`
6. Scene transitions are requested via `sceneSlice.setPendingTransition`.

### Integration points
- `InteractiveStage` provides pano mesh and camera refs for raycasting.
- Scene stack decides which scene’s hotspots are interactable (typically the active scene).
- Gamestate slice is the only place that mutates game state values.

### Legacy references
- Raycast + UV mapping:
  - `packages/morpheus/client/js/morpheus/casts/hooks/useInputHandler.ts`
- Hotspot activation rules:
  - `packages/morpheus/client/js/morpheus/casts/modules/hotspot.js`
- Gamestate mutation + transitions:
  - `packages/morpheus/client/js/morpheus/gamestate/actions.ts`
