---
date: 2026-05-16
topic: morpheus-agent-harness
focus: direct updates to align Morpheus with harness engineering and Compound Engineering practices
mode: repo-grounded
---

# Ideation: Morpheus Agent Harness

## Grounding Context

The Morpheus repo already has a partial local agent harness:

- `packages/www/server.ts` runs a local WebSocket broker at `/api/game-control`.
- `packages/www/mcp-server/index.ts` exposes Morpheus MCP tools for scene loading, rotation, state inspection, hotspot/path helpers, and connection status.
- `packages/www/src/lib/game-control-protocol.ts` defines the browser/MCP message protocol.
- `packages/www/src/morpheus-app/hooks/useGameControl.ts` connects the browser client to the broker and dispatches incoming commands.
- `packages/www/src/app/scene/stage-shell.tsx` owns App Router scene transitions, rotation state, live hotspot state, and named MCP sessions.

The strongest current gaps are:

- Harness docs are stale: some docs list seven MCP tools while the server now exposes more.
- Protocol parsing relies on weak runtime checks and unsafe casts across process boundaries.
- MCP command responses are mostly optimistic "sent" messages rather than correlated browser acknowledgements.
- `CLICK_HOTSPOT` exists in the protocol and browser hook, but `SceneStageShell` does not wire `onClickHotspot`, and the MCP click helper shortcuts through rotate/load behavior instead of exercising the real user input path.
- The broker uses single browser/MCP slots per session, which limits parallel agent/worktree workflows.
- Verification is mostly manual prose (`packages/www/test-mcp-tools.md`) rather than an executable harness with evidence artifacts.
- There is no durable repo-local knowledge base under `docs/solutions/` or `docs/agent-harness/`.

External grounding from OpenAI's harness-engineering writeup and the Compound Engineering plugin points toward repo-local knowledge, app legibility, primitive tools, evidence-producing validation loops, explicit human gates, and mechanical guardrails that prevent agent-facing drift.

## Topic Axes

- Repo-local harness knowledge
- Control primitives/action parity
- Validation evidence/testing
- Session/worktree concurrency
- Mechanical guardrails/maintenance

## Ranked Ideas

### 1. Real Input Parity Layer

**Description:** Wire `CLICK_HOTSPOT` and future pointer actions through the same browser/game input path a user exercises, then add primitive MCP commands for pointer down, pointer move, pointer up, click coordinates, and drag paths. Keep higher-level helpers like `morpheus_click_hotspot` and `morpheus_navigate_path`, but make them compose these primitives instead of shortcutting to scene loads.

**Axis:** Control primitives/action parity

**Basis:** `direct:` `CLICK_HOTSPOT` exists in `game-control-protocol.ts` and `useGameControl.ts`, but `stage-shell.tsx` does not wire `onClickHotspot`; `mcp-server/index.ts` currently approximates hotspot click by rotating and loading scenes.

**Rationale:** This is the central parity failure. Agents cannot validate intricate touch-to-drag or hotspot behavior if the harness bypasses the real input machinery.

**Downsides:** Medium implementation risk because canvas/game coordinate conversion, pano rotation, overlays, and transition side effects must be respected.

**Confidence:** 92%

**Complexity:** Medium

**Status:** Unexplored

### 2. Request/Response Correlation Spine

**Description:** Add request IDs, acknowledgements, structured results, and typed error responses for MCP-to-browser commands. Replace the single pending state request with a request ledger keyed by request ID, expected response type, session, timeout, and final observed state.

**Axis:** Validation evidence/testing

**Basis:** `direct:` `mcp-server/index.ts` has one global `pendingStateRequest`, and most command tools return that a command was sent rather than that the browser applied it.

**Rationale:** Agents need causality. A command should resolve when the target browser acknowledges the matching request and reports the relevant observed state delta.

**Downsides:** Requires touching protocol types, broker routing, MCP tool implementations, and browser hook behavior together.

**Confidence:** 90%

**Complexity:** Medium

**Status:** Unexplored

### 3. Typed Protocol Contract

**Description:** Replace ad hoc JSON parsing and unsafe casts with a shared runtime-validated protocol contract, likely using the existing `zod` dependency. The broker, MCP server, and browser hook should all import the same discriminated schemas for command and event messages.

**Axis:** Mechanical guardrails/maintenance

**Basis:** `direct:` `game-control-protocol.ts`, `server.ts`, and `mcp-server/index.ts` parse or cast unknown WebSocket payloads across process boundaries.

**Rationale:** The harness is a trust boundary. Invalid messages should fail loudly before they mutate scene state or produce misleading agent evidence.

**Downsides:** Some boilerplate and migration churn; careful typing is needed to avoid replacing unsafe casts with awkward schema wrappers.

**Confidence:** 88%

**Complexity:** Medium

**Status:** Unexplored

### 4. Evidence-Producing Harness Runner

**Description:** Add a focused harness test command that starts or targets a dev server, opens `/scene/1050?mcp=<session>`, connects MCP, loads/rotates/clicks, captures current state, records protocol messages, and stores screenshots or state artifacts under a predictable path.

**Axis:** Validation evidence/testing

**Basis:** `direct:` `packages/www/test-mcp-tools.md` records prior manual MCP testing, but there is no executable equivalent; external harness-engineering guidance emphasizes validation loops with durable evidence.

**Rationale:** Agent claims become reviewable when every meaningful validation run leaves a trace: command transcript, state snapshots, screenshots, timing, and final assertions.

**Downsides:** Browser automation dependency choice needs care; this should start as a local-only smoke runner before becoming a CI gate.

**Confidence:** 86%

**Complexity:** Medium

**Status:** Unexplored

### 5. Harness Knowledge Base

**Description:** Create `docs/agent-harness/` with an index, capability map, local startup workflow, MCP/browser boundary guide, known limitations, evidence expectations, and extension guide. Link it from root `AGENTS.md` and `packages/www/AGENTS.md`, keeping those files as maps rather than encyclopedias.

**Axis:** Repo-local harness knowledge

**Basis:** `direct:` repo guidance says new workflows should be documented, but current knowledge is split across `AGENTS.md`, `packages/www/AGENTS.md`, `packages/www/README.md`, and `packages/www/test-mcp-tools.md`; `docs/solutions/` does not exist.

**Rationale:** This is the lowest-risk compounding move. It gives future agents a stable map of what exists, what is trusted, and where to add new harness behavior.

**Downsides:** Documentation alone will drift unless paired with the drift sentinel below.

**Confidence:** 84%

**Complexity:** Low

**Status:** Unexplored

### 6. Multi-Session Harness Registry

**Description:** Evolve broker sessions from a single browser plus a single MCP client into explicit participants with client IDs, roles, ownership/lease semantics, status inspection, and collision errors. Preserve named sessions, but make their behavior deterministic for parallel agents and worktrees.

**Axis:** Session/worktree concurrency

**Basis:** `direct:` `server.ts` currently closes an existing browser or MCP client when a replacement connects to the same session.

**Rationale:** Parallel agent work depends on isolation and observability. Named sessions are a good foundation, but single-slot replacement creates hidden conflicts.

**Downsides:** This can become overbuilt. Start with clearer status and deterministic controller ownership before supporting many roles.

**Confidence:** 78%

**Complexity:** Medium

**Status:** Unexplored

### 7. Harness Drift Sentinel

**Description:** Add a maintenance check that compares protocol commands, MCP tools, browser handlers, docs, and harness tests. Fail when a command exists without browser handling, a tool exists without docs, docs list stale tool counts, or a primitive lacks validation coverage.

**Axis:** Mechanical guardrails/maintenance

**Basis:** `direct:` docs already drifted from the MCP implementation; `CLICK_HOTSPOT` exists in protocol/hook but is not wired into the scene shell.

**Rationale:** Harnesses decay at layer boundaries. A drift sentinel turns future mismatches into visible, actionable failures.

**Downsides:** Needs a stable source of truth first, probably the typed protocol contract or a tool registry.

**Confidence:** 80%

**Complexity:** Medium

**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Primitive Tool Registry / Primitive Tool Belt | Duplicates stronger Real Input Parity Layer and can become an implementation detail of the protocol contract. |
| 2 | Action Parity Matrix | Useful, but best folded into Harness Knowledge Base plus Harness Drift Sentinel. |
| 3 | CDP vs MCP Boundary Encoding | Important documentation detail, not strong enough as a standalone idea. |
| 4 | Pending Request Ledger | Narrow implementation detail of Request/Response Correlation Spine. |
| 5 | Harness Smoke Test Scene / Golden Path Verification Script / Flight Recorder Harness | Merged into Evidence-Producing Harness Runner. |
| 6 | Harness Evidence Log in `docs/solutions` | Good follow-on, but weaker than a broader harness knowledge base. |
| 7 | Browser-Real Action Bridge / Click Means Click | Duplicate of Real Input Parity Layer. |
| 8 | Session Harbor / Multi-Client Session Model | Merged into Multi-Session Harness Registry. |
