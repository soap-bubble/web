import { isCastActive, type Gamestates } from '../gamestate/isActive'
import { isVisualSpecialCast } from './matchers'
import type { Scene } from './types'

export type SceneRenderer = 'webgl' | 'special'

export interface ScenePresentationRequest {
  sceneId: number
  token: number
}

export function getScenePresentationRenderers(
  scene: Scene,
  gamestates: Gamestates
): ReadonlySet<SceneRenderer> {
  const renderers = new Set<SceneRenderer>()

  for (const cast of scene.casts) {
    if (!isCastActive({ cast, gamestates })) {
      continue
    }
    if (cast.__t === 'PanoCast') {
      renderers.add('webgl')
    }
    if (isVisualSpecialCast(cast)) {
      renderers.add('special')
    }
  }

  return renderers
}

export function areRequiredRenderersReady(
  required: ReadonlySet<SceneRenderer>,
  ready: ReadonlySet<SceneRenderer>
): boolean {
  for (const renderer of required) {
    if (!ready.has(renderer)) {
      return false
    }
  }
  return true
}
