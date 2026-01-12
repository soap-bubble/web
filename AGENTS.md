# Operation MorpheusReforge

## IMPORTANT for NODE usage
Agent terminals do not pick `.nvmrc` automatically. Before running node, npm or yarn commands first run `nvm use` in the session.

## Repo stance (facts)

- Workspace: Yarn classic + Lerna (`package.json` at repo root). No package-manager migrations without explicit approval.
- Active focus: `packages/morpheus` (engine source lives under `packages/morpheus/client/js/morpheus`) and `packages/www` (Next app).
- Legacy / do-not-touch unless requested: `packages/auth`, `packages/bot*`, `packages/cordova`, `packages/electron`, `packages/functions`, `packages/ssl`, `packages/style`, infra under `ops/`.

## Commands we still rely on

- Install deps: `yarn install`
- Root turbo entry points (Node 24 expected): `yarn lint`, `yarn typecheck`, `yarn build`, `yarn dev`
- Legacy bootstrap (runs lerna): `yarn bootstrap`
- Engine legacy dev loop: `yarn workspace @soapbubble/morpheus-client start:dev`
- Web dev loop (with MCP support): `yarn workspace morpheus-next dev`
- Web dev loop (standard Next.js): `yarn workspace morpheus-next dev:next`
- Type check everything (legacy fan-out): `yarn workspaces run type-check`
- Tests (legacy): `yarn workspace @soapbubble/morpheus-client test`

Any new scripts must target Node 24, be watch-friendly, and avoid Babel/Webpack unless grandfathered.

## MCP Game Control (Agent Testing)

The `morpheus-game` MCP server enables agents to control the game for testing. It's configured in `.cursor/mcp.json`.

### Starting a Test Session

1. Open a scene with named session: `http://localhost:3000/scene/1050?mcp=test1`
2. Connect MCP to same session: `morpheus_connect_session({ sessionName: "test1" })`
3. Use MCP tools to control the game

### Available MCP Tools

- `morpheus_connect_session` - Connect to a named session (required first step)
- `morpheus_load_scene` - Navigate to a scene by ID
- `morpheus_rotate_to` - Rotate panorama (x: 0-3600, y: -250 to 250)
- `morpheus_get_scene_info` - Query scene data (works without browser)
- `morpheus_get_current_state` - Get live state from browser
- `morpheus_list_scenes` - List all scene IDs
- `morpheus_connection_status` - Check connection state

### Named Sessions Workflow

Use named sessions (`?mcp=sessionName`) to pair MCP with a specific browser:

```
1. Agent navigates browser to: /scene/1050?mcp=agent-test-1
2. Agent calls: morpheus_connect_session({ sessionName: "agent-test-1" })
3. Browser and MCP are now paired
4. Commands flow: MCP → Broker → Browser
5. State flows: Browser → Broker → MCP
```

This allows:
- Multiple test sessions running in parallel
- Explicit control over which browser instance receives commands
- Session name preserved when navigating between scenes

**Note**: Game control only works locally with `dev`. Production deploys don't include WebSocket support.

### Using the Browser MCP for UI Testing

For tests requiring actual pointer interaction (not panorama rotation), use the `cursor-ide-browser` MCP:

1. Navigate: `browser_navigate` to `http://localhost:3000/scene/1050`
2. Take snapshot: `browser_snapshot` to see the rendered scene
3. Click elements: `browser_click` for UI interactions

The `morpheus-game` MCP is for programmatic game control (scene loading, rotation). Use `cursor-ide-browser` for visual testing and screenshots.

## Guardrails for agents

- Write strict TypeScript + modern ESM. No `as any`, no unsafe casts, no `key in obj` hacks to dodge the type system.
- React code must stay functional, explicit hooks imports (`import { useState } from 'react';`), and never rely on the global `React`.
- No new build surfaces using Webpack, Gulp, or Babel transpilation. Prefer esbuild-class toolchains (tsup, Vite, Turbo tasks).
- Question assumptions. If a change impacts bundlers, package managers, infra, or auth, stop and ask first.
- Everything under version control predates LLM workflows—document every new convention as you create it.

## Ops contract

- Keep edits scoped to the active packages unless work is explicitly staged for legacy folders.
- Document new workflows immediately here or in package-level README files.
- Never delete or reformat historical assets under `packages/morpheus/client/playthrough`, `packages/morpheus/server`, or `packages/www/public` without direction.
- Treat Firebase configs, Dockerfiles, and deployment manifests as read-only unless an ops request says otherwise.

## Open questions to resolve as we modernize

- Confirm when we migrate from Yarn v1/Lerna to a modern runner (`turbo`, `pnpm`, etc.).
- Clarify future home for auth once Next.js is upgraded (NextAuth vs custom).
- Define how much of the old Morpheus server logic survives once the engine becomes a pure TS library.
