# Morpheus Web (morpheus-next)

Next.js frontend for the Morpheus game engine.

## Getting Started

### Standard Development

```bash
yarn workspace morpheus-next dev
```

### Development with Agent Game Control (MCP)

For agent-controlled testing, use the custom server with WebSocket support:

```bash
yarn workspace morpheus-next dev
```

This enables the WebSocket broker at `ws://localhost:3000/api/game-control` for communication between the MCP server and browser.

Open [http://localhost:3000/scene/1050](http://localhost:3000/scene/1050) to load a scene.

## MCP Server for Agent Testing

The `mcp-server/` directory contains an MCP (Model Context Protocol) server that allows AI agents to control the game for testing purposes.

### Available Tools

| Tool | Description |
|------|-------------|
| `morpheus_connect_session` | Connect to a named session (browser must use `?mcp=sessionName`) |
| `morpheus_load_scene` | Navigate to a scene by ID |
| `morpheus_rotate_to` | Rotate panorama to coordinates (x: 0-3600, y: -250 to 250) |
| `morpheus_get_scene_info` | Get hotspots and connected scenes for a scene ID |
| `morpheus_get_current_state` | Get live game state from browser |
| `morpheus_list_scenes` | List all available scene IDs |
| `morpheus_connection_status` | Get current connection status |

### Session Management

The WebSocket broker manages sessions between MCP clients and browser clients using **named sessions**:

**Basic workflow:**
1. Open browser with named session: `http://localhost:3000/scene/1050?mcp=test1`
2. MCP connects to same session: `morpheus_connect_session({ sessionName: "test1" })`
3. Commands flow between the paired MCP and browser

**Session naming:**
- Browser URL: `/scene/1050?mcp=myTestSession`
- MCP tool: `morpheus_connect_session` with `sessionName: "myTestSession"`
- Both must use the **same session name** to pair

**Connection indicator:**
- Bottom-right corner shows connection status
- Green = connected, shows session name
- Red = disconnected

**Multiple sessions:**
- Different test runs can use different session names
- Each session pairs one MCP client with one browser client

### Local Development Only

The WebSocket game control is designed for **local development only**:

- The custom server (`server.ts`) must be running locally
- Production Vercel deployments use standard Next.js (no WebSocket support)
- The MCP server connects to `ws://localhost:3000/api/game-control`

For production testing, consider:
- Running a local dev server that connects to production APIs
- Using the browser MCP tools for UI interaction instead

## Scripts

| Script | Description |
|--------|-------------|
| `dev:next` | Standard Next.js dev server |
| `dev` | Custom server with WebSocket broker for MCP |
| `mcp` | Run the MCP server directly (normally auto-started by Cursor) |
| `build` | Production build |
| `start` | Production server |

## Architecture

```
┌──────────────┐  stdio   ┌──────────────┐
│    Cursor    │◄────────►│  MCP Server  │
└──────────────┘          └──────┬───────┘
                                 │ WebSocket
                                 ▼
                    ┌────────────────────────┐
                    │  Custom Next.js Server │
                    │  (port 3000)           │
                    │  └─ WebSocket Broker   │
                    └────────────┬───────────┘
                                 │ WebSocket
                                 ▼
                    ┌────────────────────────┐
                    │  Browser (Game Client) │
                    └────────────────────────┘
```
