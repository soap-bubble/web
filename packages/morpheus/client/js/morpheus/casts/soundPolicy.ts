import { isCastActive, type Gamestates } from '../gamestate/isActive'
import type {
  Cast,
  ControlledMovieCast,
  MovieSpecialCast,
  Scene,
  SoundCast,
  SupportedSoundCasts,
} from './types'

export function isSoundCast(cast: Cast): cast is SoundCast {
  return cast.__t === 'SoundCast'
}

function isMovieSpecialCast(cast: Cast): cast is MovieSpecialCast {
  return cast.__t === 'MovieSpecialCast'
}

function isControlledMovieCast(cast: Cast): cast is ControlledMovieCast {
  return cast.__t === 'ControlledMovieCast'
}

export function isAudioMovieCast(
  cast: Cast
): cast is MovieSpecialCast | ControlledMovieCast {
  return (
    (isMovieSpecialCast(cast) || isControlledMovieCast(cast)) &&
    cast.audioOnly
  )
}

/**
 * SoundCast is the engine's background-music cast. The original C++ runtime
 * forces every SoundCast to loop, so missing or false serialized `looping`
 * values must not turn background music into a one-shot clip.
 */
export function isLoopingAudioCast(cast: SupportedSoundCasts): boolean {
  return isSoundCast(cast) || (isMovieSpecialCast(cast) && cast.looping)
}

export function getStageSoundCasts({
  stageScenes,
  activeScene,
  gamestates,
}: {
  stageScenes: Scene[]
  activeScene: Scene | undefined
  gamestates: Gamestates
}): SupportedSoundCasts[] {
  const loopingSoundCasts: SoundCast[] = []
  for (const scene of stageScenes) {
    for (const cast of scene.casts) {
      if (
        isSoundCast(cast) &&
        isLoopingAudioCast(cast) &&
        isCastActive({ cast, gamestates })
      ) {
        loopingSoundCasts.push(cast)
      }
    }
  }

  const activeSceneSounds: SupportedSoundCasts[] = []
  for (const cast of activeScene?.casts ?? []) {
    if (!isCastActive({ cast, gamestates })) {
      continue
    }
    if (isSoundCast(cast)) {
      if (!isLoopingAudioCast(cast)) {
        activeSceneSounds.push(cast)
      }
      continue
    }
    if (isAudioMovieCast(cast)) {
      activeSceneSounds.push(cast)
    }
  }

  const seen = new Set<number>()
  const uniqueCasts: SupportedSoundCasts[] = []
  for (const cast of [...loopingSoundCasts, ...activeSceneSounds]) {
    if (seen.has(cast.castId)) {
      continue
    }
    seen.add(cast.castId)
    uniqueCasts.push(cast)
  }
  return uniqueCasts
}
