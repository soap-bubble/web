// @ts-ignore
import scripts from './scripts'
import { Cast, Comparator, Gamestate, Hotspot } from '../casts/types'
import { TEST_TYPES } from '../constants'

export interface Gamestates {
  byId(id: number | null): Gamestate
}

function doCompare({
  comparator: { gameStateId, testType, value },
  gamestates,
}: {
  comparator: Comparator
  gamestates: Gamestates
}) {
  const gs = gamestates.byId(gameStateId)
  if (!gs) {
    throw new Error(`Gamestate with id ${gameStateId} not found`)
  }
  const gsValue = gs.value
  switch (TEST_TYPES[testType]) {
    case 'EqualTo':
      return gsValue === value
    case 'NotEqualTo':
      return gsValue !== value
    case 'GreaterThan':
      return gsValue > value
    case 'LessThan':
      return gsValue < value
    default:
      return true
  }
}

export function isCastActive({
  cast,
  gamestates,
}: {
  cast: Cast
  gamestates: Gamestates
}) {
  const { initiallyEnabled = true, comparators = [] } = cast
  let result = true
  for (let i = 0; i < comparators.length; i++) {
    const comparator = comparators[i]
    if (
      !doCompare({
        comparator,
        gamestates,
      })
    ) {
      result = false
      break
    }
  }
  if (!initiallyEnabled) {
    result = !result
  }
  return result
}

export function isHotspotActive({
  cast,
  gamestates,
}: {
  cast: Hotspot
  gamestates: Gamestates
}) {
  let result = true
  const script = scripts(cast.type)
  if (script && script.enabled) {
    result = script.enabled(cast, gamestates)
  }
  return result
}

export function isActive({
  cast,
  gamestates,
}: {
  cast: Cast
  gamestates: Gamestates
}) {
  let result
  // @ts-ignore eventually stop using this catchall
  const script = scripts(cast.type)
  if (script && script.enabled) {
    result = script.enabled(cast, gamestates)
  } else {
    result = isCastActive({ cast, gamestates })
  }
  return result
}
