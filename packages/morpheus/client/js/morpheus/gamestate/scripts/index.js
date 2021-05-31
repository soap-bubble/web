import { isCastActive } from '../isActive'

import * as tapestry from './tapestry'
import * as influxor from './influxor'
import * as instruments from './instruments'
import * as musicbox from './musicbox'
import * as pins from './pins'
import * as mapPins from './mapPins'
import * as drums from './drums'

const scripts = [
  tapestry,
  influxor,
  instruments,
  musicbox,
  pins,
  mapPins,
  drums,
]

function enabled(cast, gamestates) {
  return isCastActive({ cast, gamestates })
}

export default function(type) {
  const script = scripts.find(({ id }) => id === type)
  if (script) {
    return Object.assign(
      {
        enabled,
      },
      script,
    )
  }
  return null
}
