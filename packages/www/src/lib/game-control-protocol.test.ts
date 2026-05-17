import { describe, expect, it } from 'vitest'

import type { BrowserToMCPMessage } from './game-control-protocol'
import {
  getErrorMessagePayload,
  isClickHotspotResult,
  parseMessage,
  serializeMessage,
} from './game-control-protocol'

describe('game-control protocol', () => {
  it('round-trips an applied hotspot click result', () => {
    const message: BrowserToMCPMessage = {
      type: 'CLICK_HOTSPOT_RESULT',
      payload: {
        requestId: 'click-1',
        outcome: 'applied',
        castId: 42,
        currentSceneId: 1050,
        expectedSourceSceneId: 1050,
        expectedSceneId: 105001,
        matchedHotspot: {
          castId: 42,
          bounds: { left: 10, right: 30, top: 40, bottom: 60 },
          actionType: 'ChangeScene',
          gesture: 'MouseClick',
          targetSceneId: 105001,
        },
        gamestateUpdates: [{ stateId: 7, value: 3 }],
        sceneTransition: { sceneId: 105001, dissolve: false },
      },
    }

    expect(parseMessage(serializeMessage(message))).toEqual(message)
  })

  it('round-trips browser-originated hotspot click failure outcomes', () => {
    const outcomes: BrowserToMCPMessage[] = [
      {
        type: 'CLICK_HOTSPOT_RESULT',
        payload: {
          requestId: 'click-2',
          outcome: 'no_matching_hotspot',
          castId: 1,
          currentSceneId: 1050,
          expectedSourceSceneId: 1050,
          message: 'No hotspot with castId 1 exists in the active scene.',
        },
      },
      {
        type: 'CLICK_HOTSPOT_RESULT',
        payload: {
          requestId: 'click-3',
          outcome: 'hotspot_inactive',
          castId: 2,
          currentSceneId: 1050,
          expectedSourceSceneId: 1050,
          message: 'Hotspot 2 is inactive for the current gamestate.',
        },
      },
      {
        type: 'CLICK_HOTSPOT_RESULT',
        payload: {
          requestId: 'click-4',
          outcome: 'expected_state_not_reached',
          castId: 3,
          currentSceneId: 1050,
          expectedSourceSceneId: 1050,
          expectedSceneId: 105001,
        },
      },
    ]

    for (const message of outcomes) {
      expect(parseMessage(serializeMessage(message))).toEqual(message)
    }
  })

  it('returns null for invalid messages', () => {
    expect(parseMessage('{')).toBeNull()
    expect(parseMessage(JSON.stringify(null))).toBeNull()
    expect(parseMessage(JSON.stringify({ payload: {} }))).toBeNull()
  })

  it('validates hotspot click result payloads before MCP resolution', () => {
    expect(
      isClickHotspotResult({
        requestId: 'click-5',
        outcome: 'unsupported_gesture',
        castId: 42,
        currentSceneId: 1050,
        expectedSourceSceneId: 1050,
        expectedSceneId: null,
      })
    ).toBe(true)

    expect(
      isClickHotspotResult({
        outcome: 'applied',
        castId: 42,
        currentSceneId: 1050,
      })
    ).toBe(false)
    expect(
      isClickHotspotResult({
        requestId: 'click-6',
        outcome: 'applied',
        castId: '42',
        currentSceneId: 1050,
      })
    ).toBe(false)
  })

  it('extracts typed error payload messages', () => {
    expect(getErrorMessagePayload({ message: 'No browser connected' })).toBe(
      'No browser connected'
    )
    expect(getErrorMessagePayload({ message: 12 })).toBeNull()
    expect(getErrorMessagePayload(null)).toBeNull()
  })
})
