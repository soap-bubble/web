import type {
  ClickHotspotMatchedHotspot,
  ClickHotspotResult,
} from '../src/lib/game-control-protocol.js'
import type { HotspotInfo, SceneInfo } from './map-query.js'

export type ClickHotspotCandidateSelection =
  | { ok: true; hotspot: HotspotInfo }
  | { ok: false; message: string }

export function selectClickHotspotCandidate(params: {
  info: SceneInfo
  castId?: number
  targetSceneId?: number
  hotspotIndex?: number
}): ClickHotspotCandidateSelection {
  const { info, castId, targetSceneId, hotspotIndex } = params

  if (
    castId === undefined &&
    targetSceneId === undefined &&
    hotspotIndex === undefined
  ) {
    return {
      ok: false,
      message: 'Must specify castId, targetSceneId, or hotspotIndex.',
    }
  }

  if (hotspotIndex !== undefined) {
    const hotspot = info.hotspots[hotspotIndex]
    if (!hotspot) {
      return {
        ok: false,
        message: `Hotspot index ${hotspotIndex} not found. Scene has ${info.hotspots.length} hotspots.`,
      }
    }

    if (castId !== undefined && hotspot.castId !== castId) {
      return {
        ok: false,
        message: `Hotspot index ${hotspotIndex} has castId ${hotspot.castId}, not requested castId ${castId}.`,
      }
    }
    if (
      targetSceneId !== undefined &&
      hotspot.targetSceneId !== targetSceneId
    ) {
      return {
        ok: false,
        message: `Hotspot index ${hotspotIndex} targets ${hotspot.targetSceneId ?? 'no scene'}, not requested scene ${targetSceneId}.`,
      }
    }

    return { ok: true, hotspot }
  }

  let candidates = info.hotspots
  if (castId !== undefined) {
    candidates = candidates.filter((hotspot) => hotspot.castId === castId)
  }
  if (targetSceneId !== undefined) {
    candidates = candidates.filter(
      (hotspot) => hotspot.targetSceneId === targetSceneId
    )
  }

  if (candidates.length === 0) {
    const targetMessage =
      targetSceneId !== undefined
        ? ` leading to scene ${targetSceneId}`
        : ''
    const castMessage =
      castId !== undefined ? ` with castId ${castId}` : ''
    return {
      ok: false,
      message: `No hotspot${castMessage}${targetMessage} found in scene ${info.sceneId}. Available targets: ${info.connectedScenes.map((c) => c.sceneId).join(', ')}`,
    }
  }

  if (candidates.length > 1) {
    return {
      ok: false,
      message: `Hotspot selector is ambiguous in scene ${info.sceneId}; ${candidates.length} hotspots match. Add hotspotIndex or targetSceneId to disambiguate.`,
    }
  }

  return { ok: true, hotspot: candidates[0] }
}

export function toClickHotspotSelector(
  hotspot: HotspotInfo
): ClickHotspotMatchedHotspot {
  return {
    castId: hotspot.castId,
    bounds: hotspot.bounds,
    actionType: hotspot.actionType,
    gesture: hotspot.gesture,
    targetSceneId: hotspot.targetSceneId,
  }
}

export function formatClickHotspotToolResult(
  result: ClickHotspotResult
): { text: string; isError: boolean } {
  const target =
    typeof result.expectedSceneId === 'number' && result.expectedSceneId > 0
      ? ` Expected scene: ${result.expectedSceneId}.`
      : ''
  const updates = result.gamestateUpdates?.length
    ? ` Gamestate updates: ${result.gamestateUpdates
        .map((update) => `${update.stateId}=${update.value}`)
        .join(', ')}.`
    : ''

  if (result.outcome === 'applied') {
    return {
      isError: false,
      text: `Hotspot ${result.castId} applied in browser. Current scene: ${result.currentSceneId}.${target}${updates}`,
    }
  }

  const reason = result.message ? ` ${result.message}` : ''
  return {
    isError: true,
    text: `Hotspot ${result.castId} did not apply. Outcome: ${result.outcome}. Current scene: ${result.currentSceneId}.${target}${updates}${reason}`,
  }
}

export function formatNoBrowserSessionResult(sessionName: string | null): {
  text: string
  isError: true
} {
  const session = sessionName ? ` "${sessionName}"` : ''
  return {
    isError: true,
    text: `No browser session${session} is connected. Open the scene URL with the matching ?mcp= session name before clicking hotspots.`,
  }
}
