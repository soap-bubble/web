/**
 * Standalone map query utilities for the MCP server.
 * This module reads morpheus.map.json directly without relying on
 * workspace-specific path mappings.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load the morpheus map JSON
const mapJsonPath = join(
  __dirname,
  '../../morpheus/client/js/service/morpheus.map.json'
)

interface MorpheusMapEntry {
  type: string
  data: Record<string, unknown>
}

interface Comparator {
  gameStateId: number
  testType: number
  value: number
}

interface Hotspot {
  castId: number
  rectTop: number
  rectBottom: number
  rectLeft: number
  rectRight: number
  cursorShapeWhenActive: number
  param1: number
  param2: number
  param3: number
  type: number
  gesture: number
  defaultPass: boolean
  initiallyEnabled: boolean
  comparators: Comparator[]
}

interface UnresolvedScene {
  sceneId: number
  cdFlags: number
  sceneType: number
  palette: number
  casts: Array<Hotspot | { ref: { castId: number } } | Record<string, unknown>>
}

// Constants
const ACTION_TYPES: Record<number, string> = {
  0: 'ChangeScene',
  1: 'DissolveTo',
  2: 'IncrementState',
  3: 'DecrementState',
  4: 'GoBack',
  5: 'Rotate',
  6: 'HorizSlider',
  7: 'VertSlider',
  8: 'TwoAxisSlider',
  9: 'SetStateTo',
  10: 'ExchangeState',
  11: 'CopyState',
  12: 'ChangeCursor',
  13: 'ReturnFromHelp',
  14: 'NoAction',
  15: 'Menu',
  99: 'DoGameAction',
}

const GESTURES = [
  'MouseDown',
  'MouseUp',
  'MouseClick',
  'MouseEnter',
  'MouseLeave',
  'MouseNone',
  'Always',
  'SceneEnter',
  'SceneExit',
  'Rotation',
]

let morpheusMap: MorpheusMapEntry[] | null = null

function getMorpheusMap(): MorpheusMapEntry[] {
  if (!morpheusMap) {
    const content = readFileSync(mapJsonPath, 'utf-8')
    morpheusMap = JSON.parse(content) as MorpheusMapEntry[]
  }
  return morpheusMap
}

function isHotspot(cast: unknown): cast is Hotspot {
  return (
    typeof cast === 'object' &&
    cast !== null &&
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
  comparators: Comparator[]
}

export interface ConnectedScene {
  sceneId: number
  fromHotspot: {
    bounds: { left: number; right: number; top: number; bottom: number }
    gesture: string
    actionType: string
  }
}

export interface SceneInfo {
  sceneId: number
  sceneType: number
  hotspots: HotspotInfo[]
  connectedScenes: ConnectedScene[]
}

function resolveScene(sceneId: number): UnresolvedScene | null {
  const map = getMorpheusMap()

  const foundScene = map.find(
    (m) =>
      m.type === 'Scene' &&
      'sceneId' in m.data &&
      m.data.sceneId === sceneId
  )

  if (!foundScene) {
    return null
  }

  return foundScene.data as unknown as UnresolvedScene
}

function extractHotspots(scene: UnresolvedScene): HotspotInfo[] {
  const hotspots: HotspotInfo[] = []

  for (const cast of scene.casts) {
    if (isHotspot(cast)) {
      const actionType = getActionTypeName(cast.type)
      const isSceneChange = cast.type === 0 || cast.type === 1

      hotspots.push({
        castId: cast.castId,
        bounds: {
          left: cast.rectLeft,
          right: cast.rectRight,
          top: cast.rectTop,
          bottom: cast.rectBottom,
        },
        actionType,
        gesture: getGestureName(cast.gesture),
        targetSceneId: isSceneChange ? cast.param1 : null,
        param1: cast.param1,
        param2: cast.param2,
        param3: cast.param3,
        cursorShape: cast.cursorShapeWhenActive,
        initiallyEnabled: cast.initiallyEnabled,
        comparators: cast.comparators,
      })
    }
  }

  return hotspots
}

function getConnectedScenesFromHotspots(
  hotspots: HotspotInfo[]
): ConnectedScene[] {
  const connectedMap = new Map<number, ConnectedScene>()

  for (const hotspot of hotspots) {
    if (hotspot.targetSceneId !== null && hotspot.targetSceneId > 0) {
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

export function getSceneInfo(sceneId: number): SceneInfo | null {
  const scene = resolveScene(sceneId)
  if (!scene) {
    return null
  }

  const hotspots = extractHotspots(scene)
  const connectedScenes = getConnectedScenesFromHotspots(hotspots)

  return {
    sceneId: scene.sceneId,
    sceneType: scene.sceneType,
    hotspots,
    connectedScenes,
  }
}

export function getAllSceneIds(): number[] {
  const map = getMorpheusMap()
  return map
    .filter((m) => m.type === 'Scene' && 'sceneId' in m.data)
    .map((m) => (m.data as { sceneId: number }).sceneId)
}
