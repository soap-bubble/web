/**
 * WebSocket message protocol for game control communication between
 * the MCP server and the browser game client.
 */

// Message types from MCP to Browser
export type MCPToBrowserMessage =
  | { type: 'LOAD_SCENE'; payload: { sceneId: number } }
  | { type: 'ROTATE_TO'; payload: { x: number; y: number } }
  | { type: 'CLICK_HOTSPOT'; payload: { castId: number } }
  | { type: 'GET_STATE' }
  | { type: 'PING' }

// Message types from Browser to MCP
export type BrowserToMCPMessage =
  | {
      type: 'STATE_UPDATE'
      payload: {
        sceneId: number
        rotation: { x: number; y: number; offsetX: number }
        hotspots: Array<{
          castId: number
          bounds: { left: number; right: number; top: number; bottom: number }
          actionType: string
          gesture: string
          targetSceneId: number | null
        }>
      }
    }
  | { type: 'SCENE_LOADED'; payload: { sceneId: number } }
  | { type: 'ERROR'; payload: { message: string } }
  | { type: 'PONG' }
  | { type: 'CONNECTED'; payload: { sessionId: string } }

// Union of all message types
export type GameControlMessage = MCPToBrowserMessage | BrowserToMCPMessage

// Client type identifier for the WebSocket broker
export type ClientType = 'browser' | 'mcp'

// Internal message with client type for broker routing
export interface BrokerMessage {
  clientType: ClientType
  message: GameControlMessage
}

/**
 * Parse a WebSocket message string into a typed message
 */
export function parseMessage(data: string): GameControlMessage | null {
  try {
    const parsed = JSON.parse(data) as GameControlMessage
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Serialize a message to a string for WebSocket transmission
 */
export function serializeMessage(message: GameControlMessage): string {
  return JSON.stringify(message)
}
