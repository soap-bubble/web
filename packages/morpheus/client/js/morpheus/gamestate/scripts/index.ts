import { isCastActive } from '../isActive'
import { Cast, Hotspot } from 'morpheus/casts/types'
import { Gamestates } from '../isActive'

import * as tapestry from './tapestry'
import * as influxor from './influxor'
import * as instruments from './instruments'
import * as musicbox from './musicbox'
import * as pins from './pins'
import * as mapPins from './mapPins'
import * as drums from './drums'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

const scripts = [
  tapestry,
  influxor,
  instruments,
  musicbox,
  pins,
  mapPins,
  drums,
]

function enabled(cast: Cast, gamestates: Gamestates): boolean {
  return isCastActive({ cast, gamestates })
}

interface Script {
  id: number
  execute?: (
    hotspot: Hotspot,
    gamestates: Gamestates,
    isMouseDown?: boolean
  ) => ThunkAction<void | null, unknown, unknown, Action>
  enabled?: (cast: Cast, gamestates: Gamestates) => boolean
}

export default function(type: number): Script | null {
  const script = scripts.find(({ id }) => id === type)
  if (script) {
    return Object.assign(
      {
        enabled,
      },
      script
    )
  }
  return null
}
