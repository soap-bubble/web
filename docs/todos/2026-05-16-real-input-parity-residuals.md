# Real Input Parity Residuals

Durable follow-ups from the hotspot-click parity review.

## Verification

- Run a real Windows Chrome smoke test against `http://localhost:3000/scene/1050?mcp=click-smoke` with the MCP session connected, then verify `morpheus_click_hotspot` succeeds through the browser. The Codex in-app browser did not register as a browser client for the named WebSocket session.
- Add a component-level browser test around `SceneStageShell` and `InteractiveStage` that proves a `CLICK_HOTSPOT` command reaches the registered harness click handler and returns the correlated `CLICK_HOTSPOT_RESULT`.
- Add a hook-level test for `useGameControl` that verifies malformed click results are never emitted and that stage-not-ready responses preserve `requestId`, source scene, and hotspot selector data.

## Harness Scope

- Replace the MCP server's single pending click slot with a small request ledger before adding parallel or compound browser actions.
- Move `morpheus_navigate_path` from direct `LOAD_SCENE` commands to composed browser-confirmed hotspot clicks once click smoke is proven stable.
- Define the next structured action primitive for legal player movies before attempting raw pointer drag fidelity. Slider/drag gestures need richer action data than a hotspot center click.
