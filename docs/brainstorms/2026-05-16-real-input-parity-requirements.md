---
date: 2026-05-16
topic: real-input-parity
---

# Real Input Parity for Hotspot Clicks

## Summary

Build an MVP real-input parity layer for hotspot clicks in the Morpheus agent harness. A basic MCP hotspot click should behave like a user click through the active scene path and produce enough observed evidence to show whether it actually worked.

---

## Problem Frame

The Morpheus repo already has a local agent-control harness with a WebSocket broker, MCP tools, a browser client hook, and named sessions. That harness can load scenes, rotate the panorama, query state, and inspect static map data.

The current click path is not equivalent to user interaction. `CLICK_HOTSPOT` exists in the protocol and browser hook, but the scene runtime does not wire it into active stage behavior. The MCP helper also approximates hotspot interaction by rotating and loading target scenes directly. That can prove that a target scene ID exists, but it cannot prove that the browser accepted a click, that the active hotspot logic ran, or that non-navigation hotspot effects were preserved.

The practical pain is precision and trust. Fine-grained controls will eventually need more than click parity, and a structured legal-action API may become more useful than raw pointer control. The first harness milestone still needs to prove the lowest meaningful user-like action before expanding into richer primitives.

---

## Actors

- A1. Agent operator: asks Codex, Cursor, or another agent to verify or navigate Morpheus scenes.
- A2. MCP controller: sends game-control commands through the local Morpheus MCP server.
- A3. Browser game client: renders the active scene and owns the user-facing input path.
- A4. Future planner/implementer: consumes this requirements doc to design the implementation without inventing behavior.

---

## Key Flows

- F1. Hotspot click through the harness
  - **Trigger:** An agent asks to click a hotspot by target scene or hotspot selection.
  - **Actors:** A1, A2, A3
  - **Steps:** The MCP controller selects a hotspot, ensures the browser is connected to the named session, asks the browser client to perform a click-equivalent hotspot interaction, and waits for observed state.
  - **Outcome:** The browser reports whether the click-equivalent interaction ran and what changed.
  - **Covered by:** R1, R2, R3, R5

- F2. Non-navigation hotspot handling
  - **Trigger:** An agent clicks a hotspot whose effect is not simply loading a scene.
  - **Actors:** A1, A2, A3
  - **Steps:** The harness routes the action through the active scene input behavior, the game applies any valid gamestate or scripted effects, and the result is visible in the returned state.
  - **Outcome:** The harness does not falsely report success by shortcutting through a scene load.
  - **Covered by:** R1, R2, R4, R5

- F3. Future precision interaction discovery
  - **Trigger:** An agent reaches a hotspot/control where click parity is insufficient, such as a slider or drag-style control.
  - **Actors:** A1, A4
  - **Steps:** The requirements make clear that click parity is the MVP, while legal action APIs and pointer primitives are future layers.
  - **Outcome:** Planning can sequence the MVP without erasing the larger direction.
  - **Covered by:** R6, R7, R8

---

## Requirements

**MVP hotspot click behavior**

- R1. The harness must support a basic hotspot click that reaches the active browser scene instead of directly substituting a scene load.
- R2. A harness-driven hotspot click must use the same hotspot eligibility rules as user interaction: the hotspot must exist in the active scene and be active for current gamestate.
- R3. For navigation hotspots, the click result must be judged by observed browser/game state after the action, not by whether a command was sent.
- R4. For non-navigation hotspots, the harness must preserve non-navigation effects such as gamestate updates or scripted hotspot behavior when those effects are already supported by the active scene input path.

**Evidence and reporting**

- R5. The MCP-facing result must distinguish at least these outcomes: interaction applied, no matching hotspot, hotspot inactive, no browser session connected, and browser did not reach the expected observed state.
- R6. The result must include enough state for an agent to decide what happened, including current scene ID and relevant state changes available from the browser client.
- R7. The MVP must avoid claiming success solely because an MCP command was accepted or sent through the broker.

**Scope for future action surfaces**

- R8. The requirements must leave room for a future structured legal-action API where agents can inspect and execute valid player actions without relying on raw UI precision.
- R9. The requirements must leave room for future pointer primitives such as down, move, up, click-at-coordinate, and drag path, but those primitives are not required for the MVP.
- R10. Higher-level helpers such as path navigation should be treated as composed conveniences over trusted primitives, not as substitutes for validating primitive interaction behavior.

---

## Acceptance Examples

- AE1. **Covers R1, R2, R3, R7.** Given a connected browser session on a scene with an active navigation hotspot, when an agent invokes the hotspot click helper for that hotspot, the result reports success only after the browser reaches the expected scene or reports the observed state that explains why it did not.
- AE2. **Covers R1, R2, R4, R7.** Given a connected browser session on a scene with an active non-navigation hotspot, when an agent invokes the hotspot click helper for that hotspot, the harness routes the interaction through active scene behavior and reports any resulting gamestate or scripted effect rather than loading an unrelated scene.
- AE3. **Covers R2, R5.** Given a hotspot that appears in static map data but is inactive under current gamestate, when an agent tries to click it, the result reports that the hotspot is inactive and does not claim success.
- AE4. **Covers R5, R6.** Given no browser client connected to the named session, when an agent tries to click a hotspot, the result reports a missing browser session and includes enough connection/session context for the agent to recover.
- AE5. **Covers R8, R9.** Given a precision control that cannot be reliably exercised through a basic click, when planning follow-on work, the next layer may choose either structured legal actions or pointer primitives without treating either as required by this MVP.

---

## Success Criteria

- Agents can perform a basic hotspot click through the Morpheus harness without bypassing the active scene input behavior.
- A failed click attempt returns an actionable reason rather than an optimistic success string.
- Navigation and non-navigation hotspot cases are both represented in requirements and later verification.
- Future planning has a clear boundary: click parity now; drag primitives and legal-action APIs later.
- The requirements are specific enough that `ce-plan` does not need to invent product behavior, scope boundaries, or success criteria.

---

## Scope Boundaries

- Full pointer down/move/up/drag primitives are deferred.
- A complete legal player-action API is deferred.
- Screenshot, video, and full artifact capture are deferred except for any minimal observed state needed to prove click behavior.
- Multi-client broker/session redesign is deferred.
- Runtime protocol validation and request/response correlation are relevant adjacent work, but this brainstorm only requires the minimum evidence semantics needed for click parity.
- Production deployment support is out of scope; this remains a local-development harness capability.

---

## Key Decisions

- Hotspot click parity is the MVP: it is the smallest useful proof that agent control can exercise real gameplay behavior.
- Raw pointer control is not the final product thesis: precision controls may be better served by structured legal actions later.
- Observed browser/game state is the success standard: command acceptance is not enough.
- Non-navigation hotspots matter: shortcutting through target scene IDs would leave a large class of game behavior untestable.

---

## Dependencies / Assumptions

- The active App Router scene runtime remains the local harness target.
- The browser client can expose enough observed state for the MVP result without solving the full evidence-artifact problem.
- Existing hotspot action behavior is the source of truth for what a user click should do.
- Static map data can help select candidate hotspots, but browser state decides whether a click is currently legal and successful.

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1, R4][Technical] Should the MVP route through synthetic browser pointer events, a shared scene-input helper, or a browser-side action bridge that calls the same hotspot processing logic?
- [Affects R5, R6][Technical] What is the smallest result envelope that gives agents enough evidence without pulling in the full request/response correlation project?
- [Affects R2][Needs research] Which scene and hotspot should serve as the first deterministic navigation and non-navigation verification cases?
- [Affects R8, R9][Technical] Where should the future legal-action API boundary sit relative to raw pointer primitives?
