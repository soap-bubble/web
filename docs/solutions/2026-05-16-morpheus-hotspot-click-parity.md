---
date: 2026-05-16
topic: morpheus-hotspot-click-parity
---

# Morpheus Hotspot Click Parity

## Learning

For the Morpheus local agent harness, static map data is candidate discovery, not proof of interaction. A hotspot click is trustworthy only when the connected browser evaluates the active scene, current gamestate, and hotspot action path, then reports the observed result.

## Applied Pattern

- MCP may use `morpheus_get_scene_info` or `map-query.ts` to choose a candidate hotspot by target scene, unique cast ID, or index.
- MCP sends `CLICK_HOTSPOT` to the browser with a request ID, expected source scene, exact hotspot selector, and optional expected target scene.
- The browser runs the active scene hotspot behavior and returns `CLICK_HOTSPOT_RESULT`.
- MCP formats success or failure from the browser result.

## Guardrail

Do not use `LOAD_SCENE` to simulate a hotspot click. Direct scene loading remains a useful explicit control primitive, but it cannot prove user-like hotspot behavior and cannot preserve non-navigation hotspot effects.

## Future Boundary

Structured legal player actions should build on the browser-authoritative action boundary. Pointer primitives such as coordinate click and drag can come later, but they should not replace browser-owned legality checks.
