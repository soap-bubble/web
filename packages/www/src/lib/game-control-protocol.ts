/**
 * WebSocket message protocol for game control communication between
 * the MCP server and the browser game client.
 */

// Message types from MCP to Browser
export type MCPToBrowserMessage =
  | { type: 'LOAD_SCENE'; payload: { sceneId: number } }
  | { type: 'ROTATE_TO'; payload: { x: number; y: number } }
  | { type: 'CLICK_HOTSPOT'; payload: ClickHotspotRequest }
  | { type: 'GET_STATE' }
  | { type: 'PING' }

export type ClickHotspotRequest = {
  requestId: string
  expectedSourceSceneId: number
  hotspot: ClickHotspotMatchedHotspot
  expectedSceneId?: number | null
}

export type ClickHotspotOutcome =
  | 'applied'
  | 'no_matching_hotspot'
  | 'hotspot_inactive'
  | 'unsupported_gesture'
  | 'source_scene_mismatch'
  | 'stage_not_ready'
  | 'expected_state_not_reached'

export type ClickHotspotObservedChange = {
  stateId: number
  value: number
}

export type ClickHotspotMatchedHotspot = {
  castId: number
  bounds: { left: number; right: number; top: number; bottom: number }
  actionType: string
  gesture: string
  targetSceneId: number | null
}

export type ClickHotspotResult = {
  requestId: string
  outcome: ClickHotspotOutcome
  castId: number
  currentSceneId: number
  expectedSourceSceneId?: number
  expectedSceneId?: number | null
  matchedHotspot?: ClickHotspotMatchedHotspot
  gamestateUpdates?: ClickHotspotObservedChange[]
  sceneTransition?: {
    sceneId: number
    dissolve: boolean
    startAngle?: number
    mode?: 'goBack'
  }
  message?: string
}

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
  | { type: 'CLICK_HOTSPOT_RESULT'; payload: ClickHotspotResult }
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
    if (isRecord(parsed) && typeof parsed.type === 'string') {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function isBounds(value: unknown): value is {
  left: number
  right: number
  top: number
  bottom: number
} {
  if (!isRecord(value)) return false
  return (
    isNumber(value.left) &&
    isNumber(value.right) &&
    isNumber(value.top) &&
    isNumber(value.bottom)
  )
}

function isMatchedHotspot(value: unknown): value is ClickHotspotMatchedHotspot {
  if (!isRecord(value)) return false
  return (
    isNumber(value.castId) &&
    isBounds(value.bounds) &&
    isString(value.actionType) &&
    isString(value.gesture) &&
    isNullableNumber(value.targetSceneId)
  )
}

function isClickHotspotOutcome(value: unknown): value is ClickHotspotOutcome {
  return (
    value === 'applied' ||
    value === 'no_matching_hotspot' ||
    value === 'hotspot_inactive' ||
    value === 'unsupported_gesture' ||
    value === 'source_scene_mismatch' ||
    value === 'stage_not_ready' ||
    value === 'expected_state_not_reached'
  )
}

function isObservedChanges(value: unknown): value is ClickHotspotObservedChange[] {
  if (!Array.isArray(value)) return false
  return value.every((change) => {
    if (!isRecord(change)) return false
    return isNumber(change.stateId) && isNumber(change.value)
  })
}

function isSceneTransition(value: unknown): value is NonNullable<
  ClickHotspotResult['sceneTransition']
> {
  if (!isRecord(value)) return false
  return (
    isNumber(value.sceneId) &&
    typeof value.dissolve === 'boolean' &&
    (value.startAngle === undefined || isNumber(value.startAngle)) &&
    (value.mode === undefined || value.mode === 'goBack')
  )
}

export function isClickHotspotResult(
  value: unknown
): value is ClickHotspotResult {
  if (!isRecord(value)) return false
  return (
    isString(value.requestId) &&
    isClickHotspotOutcome(value.outcome) &&
    isNumber(value.castId) &&
    isNumber(value.currentSceneId) &&
    (value.expectedSourceSceneId === undefined ||
      isNumber(value.expectedSourceSceneId)) &&
    (value.expectedSceneId === undefined ||
      isNullableNumber(value.expectedSceneId)) &&
    (value.matchedHotspot === undefined ||
      isMatchedHotspot(value.matchedHotspot)) &&
    (value.gamestateUpdates === undefined ||
      isObservedChanges(value.gamestateUpdates)) &&
    (value.sceneTransition === undefined ||
      isSceneTransition(value.sceneTransition)) &&
    (value.message === undefined || isString(value.message))
  )
}

export function getErrorMessagePayload(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  return isString(payload.message) ? payload.message : null
}
