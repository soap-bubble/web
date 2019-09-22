import { and, Matcher } from '../../utils/matchers'
import { MovieCast, Cast, Scene } from '../casts/types'
import {
  isFullscreen as isFullscreenCast,
  isPano as isPanoCast,
} from '../casts/matchers'
import { isCastActive, Gamestates } from '../gamestate/isActive'

export function oneOfCast<T extends Cast>(matcher: Matcher<T>) {
  return (sceneData: Scene) => {
    const { casts } = sceneData
    return !!(casts as T[]).find(matcher)
  }
}

export const isPano = oneOfCast(isPanoCast)

export const isFullscreen = (gamestates: Gamestates) =>
  oneOfCast(
    and<MovieCast>(isFullscreenCast, cast =>
      isCastActive<MovieCast>({ cast, gamestates }),
    ),
  )
