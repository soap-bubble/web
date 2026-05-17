import { describe, expect, it } from 'vitest'

import type { HotspotInfo, SceneInfo } from './map-query'
import {
  formatClickHotspotToolResult,
  formatNoBrowserSessionResult,
  selectClickHotspotCandidate,
  toClickHotspotSelector,
} from './click-hotspot-tool'

function hotspot(overrides: Partial<HotspotInfo>): HotspotInfo {
  return {
    castId: 1,
    bounds: { left: 10, right: 20, top: 30, bottom: 40 },
    actionType: 'ChangeScene',
    gesture: 'MouseClick',
    targetSceneId: 105001,
    param1: 105001,
    param2: 0,
    param3: 0,
    cursorShape: 10002,
    initiallyEnabled: true,
    comparators: [],
    ...overrides,
  }
}

function sceneInfo(hotspots: HotspotInfo[]): SceneInfo {
  return {
    sceneId: 1050,
    sceneType: 1,
    hotspots,
    connectedScenes: hotspots
      .filter((h) => h.targetSceneId !== null)
      .map((h) => ({
        sceneId: h.targetSceneId ?? 0,
        fromHotspot: {
          bounds: h.bounds,
          gesture: h.gesture,
          actionType: h.actionType,
        },
      })),
  }
}

describe('selectClickHotspotCandidate', () => {
  it('selects a hotspot by target scene', () => {
    const selected = selectClickHotspotCandidate({
      info: sceneInfo([hotspot({ castId: 7, targetSceneId: 105001 })]),
      targetSceneId: 105001,
    })

    expect(selected).toMatchObject({ ok: true })
    if (!selected.ok) {
      throw new Error('Expected selected hotspot')
    }
    expect(selected.hotspot.castId).toBe(7)
  })

  it('selects a hotspot by index', () => {
    const selected = selectClickHotspotCandidate({
      info: sceneInfo([
        hotspot({ castId: 7, targetSceneId: 105001 }),
        hotspot({ castId: 8, targetSceneId: null, actionType: 'IncrementState' }),
      ]),
      hotspotIndex: 1,
    })

    expect(selected).toMatchObject({ ok: true })
    if (!selected.ok) {
      throw new Error('Expected selected hotspot')
    }
    expect(selected.hotspot.castId).toBe(8)
  })

  it('selects a hotspot by cast id when it is unique', () => {
    const selected = selectClickHotspotCandidate({
      info: sceneInfo([
        hotspot({ castId: 7, targetSceneId: 105001 }),
        hotspot({ castId: 8, targetSceneId: null, actionType: 'IncrementState' }),
      ]),
      castId: 8,
    })

    expect(selected).toMatchObject({ ok: true })
    if (!selected.ok) {
      throw new Error('Expected selected hotspot')
    }
    expect(selected.hotspot.castId).toBe(8)
  })

  it('rejects ambiguous duplicate cast ids', () => {
    const selected = selectClickHotspotCandidate({
      info: sceneInfo([
        hotspot({ castId: 0, targetSceneId: 105001 }),
        hotspot({ castId: 0, targetSceneId: 105002 }),
      ]),
      castId: 0,
    })

    expect(selected).toEqual({
      ok: false,
      message:
        'Hotspot selector is ambiguous in scene 1050; 2 hotspots match. Add hotspotIndex or targetSceneId to disambiguate.',
    })
  })

  it('rejects missing selectors and missing candidates', () => {
    expect(
      selectClickHotspotCandidate({ info: sceneInfo([]) })
    ).toMatchObject({ ok: false })
    expect(
      selectClickHotspotCandidate({
        info: sceneInfo([hotspot({ targetSceneId: 105001 })]),
        targetSceneId: 999999,
      })
    ).toMatchObject({ ok: false })
    expect(
      selectClickHotspotCandidate({
        info: sceneInfo([]),
        hotspotIndex: 3,
      })
    ).toMatchObject({ ok: false })
  })
})

describe('formatClickHotspotToolResult', () => {
  it('formats applied browser results as success', () => {
    expect(
      formatClickHotspotToolResult({
        requestId: 'click-1',
        outcome: 'applied',
        castId: 7,
        currentSceneId: 105001,
        expectedSourceSceneId: 1050,
        expectedSceneId: 105001,
      })
    ).toEqual({
      isError: false,
      text: 'Hotspot 7 applied in browser. Current scene: 105001. Expected scene: 105001.',
    })
  })

  it('formats browser rejection results as errors', () => {
    expect(
      formatClickHotspotToolResult({
        requestId: 'click-2',
        outcome: 'hotspot_inactive',
        castId: 7,
        currentSceneId: 1050,
        expectedSourceSceneId: 1050,
        message: 'Hotspot 7 is inactive.',
      })
    ).toEqual({
      isError: true,
      text: 'Hotspot 7 did not apply. Outcome: hotspot_inactive. Current scene: 1050. Hotspot 7 is inactive.',
    })
  })

  it('formats missing browser session as an actionable error', () => {
    expect(formatNoBrowserSessionResult('test1')).toEqual({
      isError: true,
      text: 'No browser session "test1" is connected. Open the scene URL with the matching ?mcp= session name before clicking hotspots.',
    })
  })
})

describe('toClickHotspotSelector', () => {
  it('preserves exact hotspot identity for browser-side matching', () => {
    expect(
      toClickHotspotSelector(
        hotspot({
          castId: 0,
          bounds: { left: 100, right: 140, top: 20, bottom: 60 },
          targetSceneId: 105002,
        })
      )
    ).toEqual({
      castId: 0,
      bounds: { left: 100, right: 140, top: 20, bottom: 60 },
      actionType: 'ChangeScene',
      gesture: 'MouseClick',
      targetSceneId: 105002,
    })
  })
})
