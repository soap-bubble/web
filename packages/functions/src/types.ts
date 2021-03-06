export interface Morpheus {
  __t: string
}

export interface Comparator {
  gameStateId: number
  testType: number
  value: number
}

export interface Cast extends Morpheus {
  castId: number
  initiallyEnabled: boolean
  comparators: Comparator[]
}

export interface Gamestate {
  stateId: number
  initialValue: number
  minValue: number
  maxValue: number
  stateWraps: number
  value: number
}

export interface Hotspot extends Morpheus {
  castId: number
  rectTop: number
  rectBottom: number
  rectLeft: number
  rectRight: number
  cursorShapeWhenActive: number
  param1: number
  param2: number
  param3: number
  type: number
  gesture: number
  defaultPass: boolean
}

export interface MovieCast extends Cast {
  fileName: string
  url: string
  audioOnly: boolean
  width: number
  height: number
  scale?: number
  location: {
    x: number
    y: number
  }
}

export interface ControlledMovieCallback {
  frames: number
  direction: number
  callbackWhen: number
  gameState: number
  currentValue?: number
  ticks?: number
}

export interface ControlledMovieCast extends MovieCast {
  controlledLocation: MovieCast[]
  companionMovieCastId: number
  scale: number
  controlledMovieCallbacks: ControlledMovieCallback[]
}

export interface PanoAnim extends MovieCast {
  frame: number
  looping: boolean
  actionAtEnd: number
  dissolveToNextScene: boolean
  nextSceneId: number
}

export interface MovieSpecialCast extends MovieCast {
  startFrame: number
  endFrame: number
  looping: boolean
  dissolveToNextScene: boolean
  nextSceneId: number
  angleAtEnd: number
  audioOnly: boolean
  image: boolean
  actionAtEnd: boolean
}

export type PanoCast = MovieCast
export type PreloadCast = MovieCast
export type SoundCast = MovieCast

export interface Scene {
  sceneId: number
  cdFlags: number
  sceneType: number
  palette: number
  casts: Cast[]
}
export interface SceneWithRefs {
  sceneId: number
  cdFlags: number
  sceneType: number
  palette: number
  casts: (Cast | { ref: number })[]
}
