import { Matcher, and, not } from '../../utils/matchers'
import {
  Cast,
  ControlledMovieCast,
  Morpheus,
  MovieCast,
  Hotspot,
  MovieSpecialCast,
  Scene,
} from './types'

export const isPano = (sceneData: Scene) => {
  const { casts } = sceneData
  return !!casts.find((c: Morpheus) => c.__t === 'PanoCast')
}

export function forMorpheusType(type: string) {
  return (c: Morpheus) => c.__t === type
}

export const isHotspot = (c: Cast | Hotspot) => c.castId === 0

export const isAudio = (cast: MovieCast) => cast.audioOnly

export const isControlledCast = and<ControlledMovieCast>(
  forMorpheusType('ControlledMovieCast'),
  not<ControlledMovieCast>(isAudio),
)

export const isImage = (cast: MovieSpecialCast) => cast.image

export const isMovie = and(
  forMorpheusType('MovieSpecialCast'),
  and(not(isAudio), not(isImage))
) as Matcher<Cast>

export { Matcher }
