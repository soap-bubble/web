import { getMorpheusMap } from './map'
import { Gamestate } from 'morpheus/casts/types'

export function fetchInitial() {
  return getMorpheusMap()
    .filter((m) => m.type === 'GameState')
    .map((m) => m.data) as Gamestate[]
}
