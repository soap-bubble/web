import type { Scene, Hotspot, SceneCasts } from 'morpheus/casts/types'
import { fetch as fetchScene } from './scene'
import { getMorpheusMap } from './map'
import { ACTION_TYPES, GESTURES } from 'morpheus/constants'

/**
 * Hotspot information with human-readable action and gesture names
 */
export interface HotspotInfo {
  castId: number
  bounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  actionType: string
  gesture: string
  targetSceneId: number | null
  param1: number
  param2: number
  param3: number
  cursorShape: number
  initiallyEnabled: boolean
  comparators: Array<{
    gameStateId: number
    testType: number
    value: number
  }>
}

/**
 * Connected scene information
 */
export interface ConnectedScene {
  sceneId: number
  fromHotspot: {
    bounds: { left: number; right: number; top: number; bottom: number }
    gesture: string
    actionType: string
  }
}

/**
 * Scene information with hotspots and connected scenes
 */
export interface SceneInfo {
  sceneId: number
  sceneType: number
  hotspots: HotspotInfo[]
  connectedScenes: ConnectedScene[]
}

function isHotspot(cast: SceneCasts): cast is Hotspot {
  return (
    'rectLeft' in cast &&
    'rectRight' in cast &&
    'rectTop' in cast &&
    'rectBottom' in cast &&
    'gesture' in cast
  )
}

function getActionTypeName(type: number): string {
  return ACTION_TYPES[type] ?? `Unknown(${type})`
}

function getGestureName(gesture: number): string {
  return GESTURES[gesture] ?? `Unknown(${gesture})`
}

/**
 * Get a scene by ID with all casts resolved
 */
export async function getSceneInfo(sceneId: number): Promise<SceneInfo | null> {
  const scene = await fetchScene(sceneId, getMorpheusMap())
  if (!scene) {
    return null
  }

  const hotspots = getHotspotsFromScene(scene)
  const connectedScenes = getConnectedScenesFromHotspots(hotspots)

  return {
    sceneId: scene.sceneId,
    sceneType: scene.sceneType,
    hotspots,
    connectedScenes,
  }
}

/**
 * Extract hotspots from a scene with detailed information
 */
export function getHotspotsFromScene(scene: Scene): HotspotInfo[] {
  return scene.casts.filter(isHotspot).map((hotspot): HotspotInfo => {
    const actionType = getActionTypeName(hotspot.type)
    const isSceneChange =
      hotspot.type === 0 || hotspot.type === 1 // ChangeScene or DissolveTo

    return {
      castId: hotspot.castId,
      bounds: {
        left: hotspot.rectLeft,
        right: hotspot.rectRight,
        top: hotspot.rectTop,
        bottom: hotspot.rectBottom,
      },
      actionType,
      gesture: getGestureName(hotspot.gesture),
      targetSceneId: isSceneChange ? hotspot.param1 : null,
      param1: hotspot.param1,
      param2: hotspot.param2,
      param3: hotspot.param3,
      cursorShape: hotspot.cursorShapeWhenActive,
      initiallyEnabled: hotspot.initiallyEnabled,
      comparators: hotspot.comparators,
    }
  })
}

/**
 * Get hotspots for a scene by ID
 */
export async function getHotspots(sceneId: number): Promise<HotspotInfo[]> {
  const scene = await fetchScene(sceneId, getMorpheusMap())
  if (!scene) {
    return []
  }
  return getHotspotsFromScene(scene)
}

/**
 * Extract connected scenes from hotspots
 */
function getConnectedScenesFromHotspots(
  hotspots: HotspotInfo[]
): ConnectedScene[] {
  const connectedMap = new Map<number, ConnectedScene>()

  for (const hotspot of hotspots) {
    if (hotspot.targetSceneId !== null && hotspot.targetSceneId > 0) {
      // Don't overwrite if we already have this scene
      if (!connectedMap.has(hotspot.targetSceneId)) {
        connectedMap.set(hotspot.targetSceneId, {
          sceneId: hotspot.targetSceneId,
          fromHotspot: {
            bounds: hotspot.bounds,
            gesture: hotspot.gesture,
            actionType: hotspot.actionType,
          },
        })
      }
    }
  }

  return Array.from(connectedMap.values())
}

/**
 * Get all scenes connected to the given scene via hotspots
 */
export async function getConnectedScenes(
  sceneId: number
): Promise<ConnectedScene[]> {
  const hotspots = await getHotspots(sceneId)
  return getConnectedScenesFromHotspots(hotspots)
}

/**
 * Get all scene IDs in the game
 */
export function getAllSceneIds(): number[] {
  const map = getMorpheusMap()
  return map
    .filter((m) => m.type === 'Scene' && 'sceneId' in m.data)
    .map((m) => (m.data as { sceneId: number }).sceneId)
}
