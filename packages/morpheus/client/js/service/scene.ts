import { Scene, Cast, UnresolvedScene, SceneCasts } from 'morpheus/casts/types'
import { MorpheusMap, NamedMorpheusMapTypes } from './types'
import { getMorpheusMap } from './map'

type SceneCastWithRef = Cast & { ref?: { castId: number } }

export async function fetch(
  sceneId: number,
  map: MorpheusMap[] = getMorpheusMap()
): Promise<Scene | undefined> {
  const foundScene = map.find(
    (m): m is NamedMorpheusMapTypes<'Scene', UnresolvedScene> =>
      m.type === 'Scene' && 'sceneId' in m.data && m.data.sceneId === sceneId
  )

  if (!foundScene) {
    return undefined
  }

  const unresolvedScene = {
    ...foundScene.data,
    __t: foundScene.type,
  }
  const resolveCastIds = unresolvedScene.casts
    .filter(
      (c): c is { ref: { castId: number } } =>
        'ref' in c && Number.isInteger(c.ref?.castId)
    )
    .map((r) => Number(r.ref.castId))
  const resolvedCasts: Map<number, Cast> = new Map()
  let found = 0
  for (const gameObject of map) {
    const castId = Number((gameObject.data as Cast | undefined)?.castId)
    if (Number.isNaN(castId) || !resolveCastIds.includes(castId)) {
      continue
    }
    if (!resolvedCasts.has(castId)) {
      found++
    }
    resolvedCasts.set(castId, {
      ...(gameObject.data as Cast),
      __t: gameObject.type,
    })
    if (resolveCastIds.length === found) {
      break
    }
  }
  const sceneCastsWithRefs = unresolvedScene.casts as SceneCastWithRef[]
  const scene: Scene = {
    ...unresolvedScene,
    casts: sceneCastsWithRefs.map((c) => {
      if (c.ref) {
        return resolvedCasts.get(Number(c.ref.castId)) as SceneCasts
      }
      return c as SceneCasts
    }),
  }
  return scene
}
