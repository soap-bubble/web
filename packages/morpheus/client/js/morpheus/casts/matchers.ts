import { Matcher, and, or, not } from '../../utils/matchers'
import { isActive, Gamestates } from '../gamestate/isActive'
import {
  Cast,
  ControlledMovieCast,
  Morpheus,
  MovieCast,
  Hotspot,
  MovieSpecialCast,
  Scene,
} from './types'

export function forMorpheusType(type: string) {
  return (c: Morpheus) => c.__t === type
}

export const isPano = forMorpheusType('PanoCast')

export const isHotspot = (c: Cast | Hotspot) => c.castId === 0

export const isMovie = and(
  forMorpheusType('MovieSpecialCast'),
  (c: MovieSpecialCast) => !c.audioOnly && !c.image,
) as Matcher<Cast>

export const isAudio = (cast: MovieCast) => cast.audioOnly

export const isControlledCast = and<ControlledMovieCast>(
  forMorpheusType('ControlledMovieCast'),
  not<ControlledMovieCast>(isAudio),
)

export const isImage = (cast: MovieSpecialCast) => cast.image

export const isEnabledCast = ({
  cast,
  gamestates,
}: {
  cast: Cast
  gamestates: Gamestates
}) => isActive({ cast, gamestates })

export const isFullscreen = or<MovieCast>(
  and(
    cast => cast.scale === 2,
    cast => cast.width === 320,
    cast => cast.height === 200,
  ),
  and(cast => cast.width === 640, cast => cast.height === 400),
  isPano,
)
