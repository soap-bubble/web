import { VideoController } from 'morpheus/casts/components/Videos'
import {
  Cast,
  ControlledMovieCast,
  MovieSpecialCast,
} from 'morpheus/casts/types'

export interface Rect {
  x: number
  y: number
  sizeX: number
  sizeY: number
}

export type DrawSource = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement

export type DrawOperation = [
  DrawSource,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
]

export type CastSource<T, C extends Cast> = [T, C[]]
export type ImageDrawable<C extends Cast> = CastSource<DrawSource, C>
export type ImageRef = ImageDrawable<MovieSpecialCast>
export type ControlledImageRef = ImageDrawable<ControlledMovieCast>
export type VideoRef = CastSource<VideoController, MovieSpecialCast>
