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

export const MAX_SAVE_DIAGNOSTIC_FAILURE_LENGTH = 160
export const MAX_SAVE_DIAGNOSTIC_RESUME_POINT_ID_LENGTH = 200

export type LivingSaveDiagnosticSlotId = 'slot-1' | 'slot-2' | 'slot-3'

export type LivingSaveDiagnosticSlot = {
  slotId: LivingSaveDiagnosticSlotId
  state: 'empty' | 'occupied' | 'unloadable'
  revision: number
  savedAt: number | null
  sceneId: number | null
  resumePointId: string | null
  unloadableReason:
    | 'invalid-data'
    | 'unsupported-version'
    | 'incomplete-gamestate'
    | 'invalid-gamestate'
    | 'unavailable-scene'
    | null
}

export type LivingSaveDiagnostics = {
  activeSlotId: LivingSaveDiagnosticSlotId | null
  catalogRevision: number
  saveHealth: 'idle' | 'saved' | 'saving' | 'volatile' | 'save-unavailable'
  failureReason: string | null
  slots: [
    LivingSaveDiagnosticSlot,
    LivingSaveDiagnosticSlot,
    LivingSaveDiagnosticSlot
  ]
}

export type BrowserGameState = {
  sceneId: number
  rotation: { x: number; y: number; offsetX: number }
  hotspots: Array<{
    castId: number
    bounds: { left: number; right: number; top: number; bottom: number }
    actionType: string
    gesture: string
    targetSceneId: number | null
  }>
  /**
   * Local-development diagnostics only. This is intentionally a bounded
   * summary: complete save envelopes and imported/exported bytes stay in the
   * browser's IndexedDB and file APIs.
   */
  livingSaves?: LivingSaveDiagnostics
}

// Message types from Browser to MCP
export type BrowserToMCPMessage =
  | {
      type: 'STATE_UPDATE'
      payload: BrowserGameState
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

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[]
): boolean {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNonNegativeInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0
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

function isDiagnosticSlotId(
  value: unknown
): value is LivingSaveDiagnosticSlotId {
  return value === 'slot-1' || value === 'slot-2' || value === 'slot-3'
}

function isNullableDiagnosticSlotId(
  value: unknown
): value is LivingSaveDiagnosticSlotId | null {
  return value === null || isDiagnosticSlotId(value)
}

function isSaveHealth(
  value: unknown
): value is LivingSaveDiagnostics['saveHealth'] {
  return (
    value === 'idle' ||
    value === 'saved' ||
    value === 'saving' ||
    value === 'volatile' ||
    value === 'save-unavailable'
  )
}

function isUnloadableReason(
  value: unknown
): value is LivingSaveDiagnosticSlot['unloadableReason'] {
  return (
    value === null ||
    value === 'invalid-data' ||
    value === 'unsupported-version' ||
    value === 'incomplete-gamestate' ||
    value === 'invalid-gamestate' ||
    value === 'unavailable-scene'
  )
}

function isNullableBoundedString(value: unknown): value is string | null {
  return (
    value === null ||
    (isString(value) && value.length <= MAX_SAVE_DIAGNOSTIC_FAILURE_LENGTH)
  )
}

function isNullableString(value: unknown): value is string | null {
  return (
    value === null ||
    (isString(value) &&
      value.length <= MAX_SAVE_DIAGNOSTIC_RESUME_POINT_ID_LENGTH)
  )
}

function isLivingSaveDiagnosticSlot(
  value: unknown
): value is LivingSaveDiagnosticSlot {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, [
      'slotId',
      'state',
      'revision',
      'savedAt',
      'sceneId',
      'resumePointId',
      'unloadableReason'
    ]) &&
    isDiagnosticSlotId(value.slotId) &&
    (value.state === 'empty' ||
      value.state === 'occupied' ||
      value.state === 'unloadable') &&
    isNonNegativeInteger(value.revision) &&
    isNullableNumber(value.savedAt) &&
    isNullableNumber(value.sceneId) &&
    isNullableString(value.resumePointId) &&
    isUnloadableReason(value.unloadableReason)
  )
}

export function isLivingSaveDiagnostics(
  value: unknown
): value is LivingSaveDiagnostics {
  if (!isRecord(value) || !Array.isArray(value.slots)) return false
  if (value.slots.length !== 3) return false
  if (!value.slots.every(isLivingSaveDiagnosticSlot)) return false

  const slotIds = value.slots.map((slot) => slot.slotId)
  return (
    hasOnlyKeys(value, [
      'activeSlotId',
      'catalogRevision',
      'saveHealth',
      'failureReason',
      'slots'
    ]) &&
    isNullableDiagnosticSlotId(value.activeSlotId) &&
    isNonNegativeInteger(value.catalogRevision) &&
    isSaveHealth(value.saveHealth) &&
    isNullableBoundedString(value.failureReason) &&
    slotIds[0] === 'slot-1' &&
    slotIds[1] === 'slot-2' &&
    slotIds[2] === 'slot-3'
  )
}

function isRotation(value: unknown): value is BrowserGameState['rotation'] {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, ['x', 'y', 'offsetX']) &&
    isNumber(value.x) &&
    isNumber(value.y) &&
    isNumber(value.offsetX)
  )
}

function isBrowserHotspot(
  value: unknown
): value is BrowserGameState['hotspots'][number] {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, [
      'castId',
      'bounds',
      'actionType',
      'gesture',
      'targetSceneId'
    ]) &&
    isNumber(value.castId) &&
    isBounds(value.bounds) &&
    isString(value.actionType) &&
    isString(value.gesture) &&
    isNullableNumber(value.targetSceneId)
  )
}

export function isBrowserGameState(value: unknown): value is BrowserGameState {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, ['sceneId', 'rotation', 'hotspots', 'livingSaves']) &&
    isNumber(value.sceneId) &&
    isRotation(value.rotation) &&
    Array.isArray(value.hotspots) &&
    value.hotspots.every(isBrowserHotspot) &&
    (value.livingSaves === undefined ||
      isLivingSaveDiagnostics(value.livingSaves))
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
