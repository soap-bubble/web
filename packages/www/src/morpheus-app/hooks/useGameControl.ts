'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type {
  MCPToBrowserMessage,
  BrowserToMCPMessage,
  ClickHotspotRequest,
  ClickHotspotResult,
} from '@/lib/game-control-protocol'

export interface GameControlState {
  isConnected: boolean
  sessionId: string | null
}

export interface RotationState {
  x: number
  y: number
  offsetX: number
}

export interface HotspotState {
  castId: number
  bounds: { left: number; right: number; top: number; bottom: number }
  actionType: string
  gesture: string
  targetSceneId: number | null
}

export interface GameControlCallbacks {
  onLoadScene?: (sceneId: number) => void
  onRotateTo?: (x: number, y: number) => void
  onClickHotspot?: (
    request: ClickHotspotRequest
  ) => ClickHotspotResult | Promise<ClickHotspotResult>
}

export interface GameStateGetter {
  (): {
    sceneId: number
    rotation: RotationState
    hotspots: HotspotState[]
  } | null
}

interface UseGameControlOptions {
  enabled?: boolean
  sessionName?: string | null
  callbacks?: GameControlCallbacks
  getState?: GameStateGetter
}

interface UseGameControlReturn {
  state: GameControlState
  sendStateUpdate: (
    sceneId: number,
    rotation: RotationState,
    hotspots: HotspotState[]
  ) => void
  sendSceneLoaded: (sceneId: number) => void
  sendError: (message: string) => void
}

function getWebSocketUrl(sessionName?: string | null): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3000/api/game-control'
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const baseUrl = `${protocol}//${window.location.host}/api/game-control?client=browser`
  if (sessionName) {
    return `${baseUrl}&session=${encodeURIComponent(sessionName)}`
  }
  return baseUrl
}

const RECONNECT_DELAY_MS = 500
const MAX_RECONNECT_ATTEMPTS = 20

export default function useGameControl(
  options: UseGameControlOptions = {}
): UseGameControlReturn {
  const { enabled = true, sessionName, callbacks, getState } = options
  const wsRef = useRef<WebSocket | null>(null)
  const callbacksRef = useRef(callbacks)
  const getStateRef = useRef(getState)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const [state, setState] = useState<GameControlState>({
    isConnected: false,
    sessionId: null,
  })

  // Keep refs updated
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  useEffect(() => {
    getStateRef.current = getState
  }, [getState])

  const sendMessage = useCallback((message: BrowserToMCPMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  const sendStateUpdate = useCallback(
    (sceneId: number, rotation: RotationState, hotspots: HotspotState[]) => {
      sendMessage({
        type: 'STATE_UPDATE',
        payload: { sceneId, rotation, hotspots },
      })
    },
    [sendMessage]
  )

  const sendSceneLoaded = useCallback(
    (sceneId: number) => {
      sendMessage({
        type: 'SCENE_LOADED',
        payload: { sceneId },
      })
    },
    [sendMessage]
  )

  const sendError = useCallback(
    (message: string) => {
      sendMessage({
        type: 'ERROR',
        payload: { message },
      })
    },
    [sendMessage]
  )

  const getCurrentSceneId = useCallback(() => {
    return getStateRef.current?.()?.sceneId ?? 0
  }, [])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as
        | MCPToBrowserMessage
        | BrowserToMCPMessage

      switch (message.type) {
        case 'LOAD_SCENE':
          console.log('[GameControl] Load scene:', message.payload.sceneId)
          callbacksRef.current?.onLoadScene?.(message.payload.sceneId)
          break

        case 'ROTATE_TO':
          console.log(
            '[GameControl] Rotate to:',
            message.payload.x,
            message.payload.y
          )
          callbacksRef.current?.onRotateTo?.(
            message.payload.x,
            message.payload.y
          )
          break

        case 'CLICK_HOTSPOT':
          console.log(
            '[GameControl] Click hotspot:',
            message.payload.hotspot.castId
          )
          const clickHotspot = callbacksRef.current?.onClickHotspot
          if (!clickHotspot) {
            sendMessage({
              type: 'CLICK_HOTSPOT_RESULT',
              payload: {
                requestId: message.payload.requestId,
                outcome: 'stage_not_ready',
                castId: message.payload.hotspot.castId,
                currentSceneId: getCurrentSceneId(),
                expectedSourceSceneId: message.payload.expectedSourceSceneId,
                expectedSceneId: message.payload.expectedSceneId,
                message: 'Game stage is not ready for hotspot clicks.',
              },
            })
            break
          }

          void Promise.resolve(clickHotspot(message.payload))
            .then((result) => {
              sendMessage({
                type: 'CLICK_HOTSPOT_RESULT',
                payload: result,
              })
            })
            .catch((error: unknown) => {
              const errorMessage =
                error instanceof Error ? error.message : String(error)
              sendMessage({
                type: 'CLICK_HOTSPOT_RESULT',
                payload: {
                  requestId: message.payload.requestId,
                  outcome: 'stage_not_ready',
                  castId: message.payload.hotspot.castId,
                  currentSceneId: getCurrentSceneId(),
                  expectedSourceSceneId: message.payload.expectedSourceSceneId,
                  expectedSceneId: message.payload.expectedSceneId,
                  message: errorMessage,
                },
              })
            })
          break

        case 'GET_STATE':
          console.log('[GameControl] Get state requested')
          const currentState = getStateRef.current?.()
          if (currentState) {
            sendMessage({
              type: 'STATE_UPDATE',
              payload: currentState,
            })
          } else {
            sendMessage({
              type: 'ERROR',
              payload: { message: 'Game state not available' },
            })
          }
          break

        case 'PING':
          sendMessage({ type: 'PONG' })
          break

        case 'CONNECTED':
          console.log(
            '[GameControl] Connected with session:',
            message.payload.sessionId
          )
          setState((prev) => ({
            ...prev,
            sessionId: message.payload.sessionId,
          }))
          break

        default:
          // Ignore messages meant for other clients
          break
      }
    } catch (error) {
      console.error('[GameControl] Error parsing message:', error)
    }
  }, [getCurrentSceneId, sendMessage])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const url = getWebSocketUrl(sessionName)
    console.log('[GameControl] Connecting to:', url)

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        console.log('[GameControl] Connected')
        reconnectAttemptsRef.current = 0
        setState((prev) => ({ ...prev, isConnected: true }))
      }

      ws.onmessage = handleMessage

      ws.onclose = (event) => {
        console.log('[GameControl] Disconnected:', event.code, event.reason)
        setState({ isConnected: false, sessionId: null })
        wsRef.current = null

        // Attempt to reconnect with exponential backoff
        if (enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++
          const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttemptsRef.current, 5)
          console.log(
            `[GameControl] Scheduling reconnect ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
          )
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[GameControl] Attempting reconnect...')
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('[GameControl] Max reconnect attempts reached')
        }
      }

      ws.onerror = (error) => {
        console.error('[GameControl] WebSocket error:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[GameControl] Failed to create WebSocket:', error)
    }
  }, [enabled, sessionName, handleMessage])

  useEffect(() => {
    if (!enabled) {
      return
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [enabled, connect])

  return {
    state,
    sendStateUpdate,
    sendSceneLoaded,
    sendError,
  }
}
