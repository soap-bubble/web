#!/usr/bin/env node
/**
 * Morpheus Game MCP Server
 *
 * This MCP server provides tools for agent-controlled game testing.
 * It connects to the game's WebSocket broker to send commands and receive state.
 *
 * Tools:
 * - morpheus_connect_session: Connect to a named session (browser must use ?mcp=sessionName)
 * - morpheus_load_scene: Navigate to a scene by ID
 * - morpheus_rotate_to: Rotate panorama to coordinates
 * - morpheus_get_scene_info: Get hotspots and connected scenes
 * - morpheus_get_current_state: Get current game state from browser
 * - morpheus_list_scenes: List all available scene IDs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import WebSocket from 'ws'
// Local map query module for MCP server (standalone, no workspace path deps)
import { getSceneInfo, getAllSceneIds } from './map-query.js'
import {
  formatClickHotspotToolResult,
  formatNoBrowserSessionResult,
  selectClickHotspotCandidate,
  toClickHotspotSelector,
} from './click-hotspot-tool.js'
import type {
  BrowserGameState,
  ClickHotspotRequest,
  ClickHotspotResult,
} from '../src/lib/game-control-protocol.js'
import {
  isBrowserGameState,
  getErrorMessagePayload,
  isClickHotspotResult,
} from '../src/lib/game-control-protocol.js'

// WebSocket connection state
let ws: WebSocket | null = null
let sessionId: string | null = null
let targetSessionName: string | null = null
let isConnected = false
let isReconnecting = false
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY_MS = 1000
let pendingStateRequest: {
  resolve: (value: BrowserGameState) => void
  reject: (error: Error) => void
} | null = null
let pendingClickRequest: {
  requestId: string
  castId: number
  timeoutId: NodeJS.Timeout
  resolve: (value: ClickHotspotResult) => void
  reject: (error: Error) => void
} | null = null
let clickRequestCounter = 0

const WS_URL = process.env.GAME_WS_URL ?? 'ws://localhost:3000/api/game-control'

function nextClickRequestId(): string {
  clickRequestCounter += 1
  return `click-${Date.now()}-${clickRequestCounter}`
}

function clearPendingClickRequest(): void {
  if (!pendingClickRequest) {
    return
  }
  clearTimeout(pendingClickRequest.timeoutId)
  pendingClickRequest = null
}

function connectWebSocket(sessionName?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If we're already connected to a different session, disconnect first
    if (ws?.readyState === WebSocket.OPEN) {
      if (sessionName && sessionName !== targetSessionName) {
        ws.close()
        ws = null
        isConnected = false
      } else {
        resolve()
        return
      }
    }

    // Use provided sessionName or fall back to existing targetSessionName
    const session = sessionName ?? targetSessionName
    const url = `${WS_URL}?client=mcp${session ? `&session=${encodeURIComponent(session)}` : ''}`
    console.error(`[MCP] Connecting to ${url}`)

    ws = new WebSocket(url)

    ws.on('open', () => {
      console.error('[MCP] WebSocket connected')
      isConnected = true
      reconnectAttempts = 0
      resolve()
    })

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        handleMessage(message)
      } catch (error) {
        console.error('[MCP] Error parsing message:', error)
      }
    })

    ws.on('close', () => {
      console.error('[MCP] WebSocket disconnected')
      isConnected = false
      ws = null
      
      // Auto-reconnect if we have a session
      if (targetSessionName && !isReconnecting && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        isReconnecting = true
        reconnectAttempts++
        const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts, 5)
        console.error(`[MCP] Scheduling reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`)
        setTimeout(() => {
          isReconnecting = false
          connectWebSocket(targetSessionName ?? undefined).catch((err) => {
            console.error('[MCP] Reconnect failed:', err)
          })
        }, delay)
      }
    })

    ws.on('error', (error) => {
      console.error('[MCP] WebSocket error:', error)
      reject(error)
    })

    // Timeout connection attempt
    setTimeout(() => {
      if (!isConnected) {
        reject(new Error('WebSocket connection timeout'))
      }
    }, 5000)
  })
}

function handleMessage(message: { type: string; payload?: unknown }): void {
  switch (message.type) {
    case 'CONNECTED':
      sessionId = (message.payload as { sessionId: string }).sessionId
      // Track the session name we connected to
      if (targetSessionName) {
        console.error(`[MCP] Connected to named session: ${targetSessionName} (id: ${sessionId})`)
      } else {
        console.error(`[MCP] Connected to auto-generated session: ${sessionId}`)
      }
      break

    case 'STATE_UPDATE':
      if (pendingStateRequest) {
        if (!isBrowserGameState(message.payload)) {
          pendingStateRequest.reject(
            new Error('Malformed game state from browser')
          )
          pendingStateRequest = null
          break
        }
        pendingStateRequest.resolve(message.payload)
        pendingStateRequest = null
      }
      break

    case 'SCENE_LOADED':
      console.error(
        `[MCP] Scene loaded: ${(message.payload as { sceneId: number }).sceneId}`
      )
      break

    case 'CLICK_HOTSPOT_RESULT':
      if (pendingClickRequest) {
        if (!isClickHotspotResult(message.payload)) {
          pendingClickRequest.reject(
            new Error('Malformed click hotspot result from browser')
          )
          clearPendingClickRequest()
          break
        }
        if (message.payload.requestId !== pendingClickRequest.requestId) {
          break
        }
        if (message.payload.castId !== pendingClickRequest.castId) {
          pendingClickRequest.reject(
            new Error(
              `Click hotspot result castId mismatch: expected ${pendingClickRequest.castId}, got ${message.payload.castId}`
            )
          )
          clearPendingClickRequest()
          break
        }
        pendingClickRequest.resolve(message.payload)
        clearPendingClickRequest()
      }
      break

    case 'ERROR': {
      const errorMessage =
        getErrorMessagePayload(message.payload) ?? 'Unknown game error'
      console.error(`[MCP] Game error: ${errorMessage}`)
      if (pendingStateRequest) {
        pendingStateRequest.reject(new Error(errorMessage))
        pendingStateRequest = null
      }
      if (pendingClickRequest) {
        pendingClickRequest.reject(new Error(errorMessage))
        clearPendingClickRequest()
      }
      break
    }

    case 'PONG':
      // Heartbeat response
      break
  }
}

function sendMessage(message: { type: string; payload?: unknown }): void {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  } else {
    throw new Error('WebSocket not connected')
  }
}

async function ensureConnected(sessionName?: string): Promise<void> {
  // If a new session name is provided, update the target
  if (sessionName) {
    targetSessionName = sessionName
  }
  if (!isConnected) {
    await connectWebSocket(targetSessionName ?? undefined)
  }
}

async function requestGameState(): Promise<BrowserGameState> {
  await ensureConnected()

  return new Promise((resolve, reject) => {
    pendingStateRequest = { resolve, reject }
    sendMessage({ type: 'GET_STATE' })

    // Timeout
    setTimeout(() => {
      if (pendingStateRequest) {
        pendingStateRequest.reject(new Error('State request timeout'))
        pendingStateRequest = null
      }
    }, 5000)
  })
}

async function requestHotspotClick(
  payload: ClickHotspotRequest
): Promise<ClickHotspotResult> {
  await ensureConnected()

  return new Promise((resolve, reject) => {
    if (pendingClickRequest) {
      reject(new Error('Click hotspot request already pending'))
      return
    }

    const timeoutId = setTimeout(() => {
      if (pendingClickRequest) {
        pendingClickRequest.reject(new Error('Click hotspot result timeout'))
        pendingClickRequest = null
      }
    }, 8000)
    pendingClickRequest = {
      requestId: payload.requestId,
      castId: payload.hotspot.castId,
      timeoutId,
      resolve,
      reject,
    }
    try {
      sendMessage({ type: 'CLICK_HOTSPOT', payload })
    } catch (error) {
      clearPendingClickRequest()
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/**
 * Find a path between two scenes using BFS
 */
function findPath(
  fromSceneId: number,
  toSceneId: number,
  maxDepth = 10
): Array<{ sceneId: number; viaHotspot?: { bounds: { left: number; right: number; top: number; bottom: number }; gesture: string } }> | null {
  if (fromSceneId === toSceneId) {
    return [{ sceneId: fromSceneId }]
  }

  interface QueueItem {
    sceneId: number
    path: Array<{ sceneId: number; viaHotspot?: { bounds: { left: number; right: number; top: number; bottom: number }; gesture: string } }>
  }

  const visited = new Set<number>()
  const queue: QueueItem[] = [{ sceneId: fromSceneId, path: [{ sceneId: fromSceneId }] }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || current.path.length > maxDepth) {
      continue
    }

    if (visited.has(current.sceneId)) {
      continue
    }
    visited.add(current.sceneId)

    const info = getSceneInfo(current.sceneId)
    if (!info) {
      continue
    }

    for (const connected of info.connectedScenes) {
      if (connected.sceneId === toSceneId) {
        return [
          ...current.path,
          {
            sceneId: connected.sceneId,
            viaHotspot: {
              bounds: connected.fromHotspot.bounds,
              gesture: connected.fromHotspot.gesture,
            },
          },
        ]
      }

      if (!visited.has(connected.sceneId)) {
        queue.push({
          sceneId: connected.sceneId,
          path: [
            ...current.path,
            {
              sceneId: connected.sceneId,
              viaHotspot: {
                bounds: connected.fromHotspot.bounds,
                gesture: connected.fromHotspot.gesture,
              },
            },
          ],
        })
      }
    }
  }

  return null
}

// Create MCP server
const server = new McpServer({
  name: 'morpheus-game',
  version: '1.0.0',
})

// Tool: Connect to Session
server.registerTool(
  'morpheus_connect_session',
  {
    description:
      'Connect to a named game session. The browser must be opened with the same session name: /scene/1050?mcp=sessionName. This allows targeting a specific browser instance for testing.',
    inputSchema: {
      sessionName: z
        .string()
        .describe(
          'The session name to connect to. Must match the ?mcp= query param in the browser URL.'
        ),
    },
  },
  async ({ sessionName }) => {
    try {
      // Disconnect from current session if connected
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close()
        ws = null
        isConnected = false
      }

      targetSessionName = sessionName
      await connectWebSocket(sessionName)

      return {
        content: [
          {
            type: 'text' as const,
            text: `Connected to session "${sessionName}". Browser URL should include ?mcp=${encodeURIComponent(sessionName)}`,
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error connecting to session: ${message}. Make sure the game server is running (yarn workspace morpheus-next dev).`,
          },
        ],
        isError: true,
      }
    }
  }
)

// Tool: Load Scene
server.registerTool(
  'morpheus_load_scene',
  {
    description:
      'Navigate the game to a specific scene by ID. This will load the scene in the browser.',
    inputSchema: {
      sceneId: z.number().describe('The scene ID to load (e.g., 1050)'),
    },
  },
  async ({ sceneId }) => {
    try {
      await ensureConnected()
      sendMessage({ type: 'LOAD_SCENE', payload: { sceneId } })

      return {
        content: [
          {
            type: 'text' as const,
            text: `Sent command to load scene ${sceneId}. The browser will navigate to /scene/${sceneId}.`,
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Rotate To
server.registerTool(
  'morpheus_rotate_to',
  {
    description:
      'Rotate the panorama view to specific coordinates. X ranges from 0-3600 (horizontal), Y ranges from roughly -120 to 120 (vertical).',
    inputSchema: {
      x: z
        .number()
        .min(0)
        .max(3600)
        .describe('Horizontal position (0-3600, wraps around)'),
      y: z
        .number()
        .min(-120)
        .max(120)
        .describe('Vertical position (-120 to 120, clamped)'),
    },
  },
  async ({ x, y }) => {
    try {
      await ensureConnected()
      sendMessage({ type: 'ROTATE_TO', payload: { x, y } })

      return {
        content: [
          {
            type: 'text' as const,
            text: `Rotated panorama to position (${x}, ${y}).`,
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Get Scene Info
server.registerTool(
  'morpheus_get_scene_info',
  {
    description:
      'Get detailed information about a scene including its hotspots and connected scenes. This queries the game data directly without requiring a browser connection.',
    inputSchema: {
      sceneId: z.number().describe('The scene ID to get info for'),
    },
  },
  async ({ sceneId }) => {
    try {
      const info = await getSceneInfo(sceneId)

      if (!info) {
        return {
          content: [
            { type: 'text' as const, text: `Scene ${sceneId} not found.` },
          ],
          isError: true,
        }
      }

      const result = {
        sceneId: info.sceneId,
        sceneType: info.sceneType,
        hotspotCount: info.hotspots.length,
        connectedScenes: info.connectedScenes.map((cs) => ({
          sceneId: cs.sceneId,
          bounds: cs.fromHotspot.bounds,
          gesture: cs.fromHotspot.gesture,
          actionType: cs.fromHotspot.actionType,
        })),
        hotspots: info.hotspots.map((h) => ({
          castId: h.castId,
          bounds: h.bounds,
          actionType: h.actionType,
          gesture: h.gesture,
          targetSceneId: h.targetSceneId,
          enabled: h.initiallyEnabled,
        })),
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Get Current State
server.registerTool(
  'morpheus_get_current_state',
  {
    description:
      'Get the current game state from the browser, including the loaded scene, current rotation, visible hotspots, and bounded read-only living-save diagnostics. Save data and save-management commands are not exposed.',
  },
  async () => {
    try {
      const state = await requestGameState()

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(state, null, 2),
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error getting game state: ${message}. Make sure the game is running and connected.`,
          },
        ],
        isError: true,
      }
    }
  }
)

// Tool: List All Scenes
server.registerTool(
  'morpheus_list_scenes',
  {
    description:
      'List all available scene IDs in the game. Useful for discovering what scenes exist.',
  },
  async () => {
    try {
      const sceneIds = getAllSceneIds()

      return {
        content: [
          {
            type: 'text' as const,
            text: `Found ${sceneIds.length} scenes.\n\nScene IDs: ${sceneIds.slice(0, 50).join(', ')}${sceneIds.length > 50 ? `... and ${sceneIds.length - 50} more` : ''}`,
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Get Connection Status
server.registerTool(
  'morpheus_connection_status',
  {
    description:
      'Get the current WebSocket connection status, including session name and connection state.',
  },
  async () => {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              isConnected,
              sessionName: targetSessionName,
              sessionId,
              wsUrl: WS_URL,
              reconnectAttempts,
            },
            null,
            2
          ),
        },
      ],
    }
  }
)

// Tool: Rotate To Hotspot
server.registerTool(
  'morpheus_rotate_to_hotspot',
  {
    description:
      'Rotate the panorama to center a specific hotspot in view. Uses the hotspot bounds to calculate the center position.',
    inputSchema: {
      sceneId: z.number().describe('The scene ID containing the hotspot'),
      targetSceneId: z
        .number()
        .optional()
        .describe('Optional: Find the hotspot that leads to this target scene'),
      hotspotIndex: z
        .number()
        .optional()
        .describe('Optional: The index of the hotspot in the scene (0-based)'),
    },
  },
  async ({ sceneId, targetSceneId, hotspotIndex }) => {
    try {
      const info = getSceneInfo(sceneId)
      if (!info) {
        return {
          content: [
            { type: 'text' as const, text: `Scene ${sceneId} not found.` },
          ],
          isError: true,
        }
      }

      let hotspot: (typeof info.hotspots)[0] | undefined

      if (targetSceneId !== undefined) {
        hotspot = info.hotspots.find((h) => h.targetSceneId === targetSceneId)
        if (!hotspot) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No hotspot in scene ${sceneId} leads to scene ${targetSceneId}.`,
              },
            ],
            isError: true,
          }
        }
      } else if (hotspotIndex !== undefined) {
        hotspot = info.hotspots[hotspotIndex]
        if (!hotspot) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Hotspot index ${hotspotIndex} not found. Scene has ${info.hotspots.length} hotspots.`,
              },
            ],
            isError: true,
          }
        }
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Must specify either targetSceneId or hotspotIndex.',
            },
          ],
          isError: true,
        }
      }

      // Calculate center of hotspot bounds
      const centerX = Math.round(
        (hotspot.bounds.left + hotspot.bounds.right) / 2
      )
      const centerY = Math.round(
        (hotspot.bounds.top + hotspot.bounds.bottom) / 2
      )

      await ensureConnected()
      sendMessage({ type: 'ROTATE_TO', payload: { x: centerX, y: centerY } })

      return {
        content: [
          {
            type: 'text' as const,
            text: `Rotated to hotspot center (${centerX}, ${centerY}). Hotspot: ${hotspot.actionType} -> ${hotspot.targetSceneId ?? 'N/A'} (${hotspot.gesture})`,
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Click Hotspot
server.registerTool(
  'morpheus_click_hotspot',
  {
    description:
      'Click a hotspot through the connected browser scene. Success is based on the browser-reported click result, not direct scene loading.',
    inputSchema: {
      sceneId: z.number().describe('The current scene ID'),
      targetSceneId: z
        .number()
        .optional()
        .describe('Click the hotspot that leads to this target scene'),
      hotspotIndex: z
        .number()
        .optional()
        .describe('The index of the hotspot to click (0-based)'),
      castId: z
        .number()
        .optional()
        .describe(
          'The hotspot castId to click. If multiple hotspots share this castId, add targetSceneId or hotspotIndex.'
        ),
    },
  },
  async ({ sceneId, targetSceneId, hotspotIndex, castId }) => {
    try {
      const info = getSceneInfo(sceneId)
      if (!info) {
        return {
          content: [
            { type: 'text' as const, text: `Scene ${sceneId} not found.` },
          ],
          isError: true,
        }
      }

      const selected = selectClickHotspotCandidate({
        info,
        castId,
        targetSceneId,
        hotspotIndex,
      })

      if (!selected.ok) {
        return {
          content: [
            {
              type: 'text' as const,
              text: selected.message,
            },
          ],
          isError: true,
        }
      }

      const result = await requestHotspotClick({
        requestId: nextClickRequestId(),
        expectedSourceSceneId: sceneId,
        hotspot: toClickHotspotSelector(selected.hotspot),
        expectedSceneId: selected.hotspot.targetSceneId,
      })
      const formatted = formatClickHotspotToolResult(result)

      return {
        content: [
          {
            type: 'text' as const,
            text: formatted.text,
          },
        ],
        isError: formatted.isError,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('No browser client connected')) {
        const formatted = formatNoBrowserSessionResult(targetSessionName)
        return {
          content: [
            {
              type: 'text' as const,
              text: formatted.text,
            },
          ],
          isError: formatted.isError,
        }
      }
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Find Path Between Scenes
server.registerTool(
  'morpheus_find_path',
  {
    description:
      'Find a navigation path between two scenes using hotspot connections. Returns the sequence of scenes to visit and which hotspots to use.',
    inputSchema: {
      fromSceneId: z.number().describe('The starting scene ID'),
      toSceneId: z.number().describe('The destination scene ID'),
      maxDepth: z
        .number()
        .optional()
        .default(10)
        .describe('Maximum path length to search (default: 10)'),
    },
  },
  async ({ fromSceneId, toSceneId, maxDepth }) => {
    try {
      const path = findPath(fromSceneId, toSceneId, maxDepth)

      if (!path) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No path found from scene ${fromSceneId} to scene ${toSceneId} within ${maxDepth} steps.`,
            },
          ],
          isError: true,
        }
      }

      const pathDescription = path
        .map((step, i) => {
          if (i === 0) {
            return `Start: Scene ${step.sceneId}`
          }
          const hotspotInfo = step.viaHotspot
            ? ` via hotspot at (${step.viaHotspot.bounds.left}-${step.viaHotspot.bounds.right}, ${step.viaHotspot.bounds.top}-${step.viaHotspot.bounds.bottom})`
            : ''
          return `Step ${i}: Go to Scene ${step.sceneId}${hotspotInfo}`
        })
        .join('\n')

      return {
        content: [
          {
            type: 'text' as const,
            text: `Path found (${path.length - 1} steps):\n\n${pathDescription}\n\nFull path data:\n${JSON.stringify(path, null, 2)}`,
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Tool: Navigate Path
server.registerTool(
  'morpheus_navigate_path',
  {
    description:
      'Automatically navigate from the current scene to a target scene by following the hotspot path. Will rotate and load each scene in sequence.',
    inputSchema: {
      fromSceneId: z.number().describe('The starting scene ID (current scene)'),
      toSceneId: z.number().describe('The destination scene ID'),
      stepDelay: z
        .number()
        .optional()
        .default(1000)
        .describe('Delay between steps in milliseconds (default: 1000)'),
    },
  },
  async ({ fromSceneId, toSceneId, stepDelay }) => {
    try {
      const path = findPath(fromSceneId, toSceneId)

      if (!path) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No path found from scene ${fromSceneId} to scene ${toSceneId}.`,
            },
          ],
          isError: true,
        }
      }

      if (path.length === 1) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Already at destination scene ${toSceneId}.`,
            },
          ],
        }
      }

      await ensureConnected()

      const steps: string[] = []
      steps.push(`Starting navigation from scene ${fromSceneId} to scene ${toSceneId} (${path.length - 1} steps)`)

      // Navigate each step (skip first which is current scene)
      for (let i = 1; i < path.length; i++) {
        const step = path[i]
        
        if (step.viaHotspot) {
          // Rotate to hotspot center
          const centerX = Math.round(
            (step.viaHotspot.bounds.left + step.viaHotspot.bounds.right) / 2
          )
          const centerY = Math.round(
            (step.viaHotspot.bounds.top + step.viaHotspot.bounds.bottom) / 2
          )
          sendMessage({ type: 'ROTATE_TO', payload: { x: centerX, y: centerY } })
          steps.push(`Step ${i}: Rotated to (${centerX}, ${centerY})`)
          
          await new Promise((resolve) => setTimeout(resolve, stepDelay / 2))
        }

        // Load the next scene
        sendMessage({ type: 'LOAD_SCENE', payload: { sceneId: step.sceneId } })
        steps.push(`Step ${i}: Loaded scene ${step.sceneId}`)
        
        // Wait for scene transition
        if (i < path.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, stepDelay))
        }
      }

      steps.push(`Arrived at destination scene ${toSceneId}`)

      return {
        content: [
          {
            type: 'text' as const,
            text: steps.join('\n'),
          },
        ],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      }
    }
  }
)

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[MCP] Morpheus Game MCP server started')
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error)
  process.exit(1)
})
