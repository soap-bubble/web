import {
  Cast,
  Scene,
  UnresolvedScene,
  MovieSpecialCast,
  Hotspot,
  PanoAnim,
  PanoCast,
  SoundCast,
  ControlledMovieCast,
  ControlledMovieCallback,
  Gamestate,
  Morpheus,
  Comparator,
  MovieCast,
  SupportedSoundCasts,
} from 'morpheus/casts/types'

type MorpheusMapTypes =
  | Gamestate
  | UnresolvedScene
  | MovieSpecialCast
  | Hotspot
  | PanoAnim
  | PanoCast
  | SoundCast
  | ControlledMovieCast
  | MovieCast

export type NamedMorpheusMapTypes<
  T extends string,
  D extends MorpheusMapTypes,
> = {
  type: T
  data: D
}

export type MorpheusMapDataTypes =
  | NamedMorpheusMapTypes<'GameState', Gamestate>
  | NamedMorpheusMapTypes<'Scene', UnresolvedScene>
  | NamedMorpheusMapTypes<'MovieSpecialCast', MovieSpecialCast>
  | NamedMorpheusMapTypes<'Hotspot', Hotspot>
  | NamedMorpheusMapTypes<'PanoAnim', PanoAnim>
  | NamedMorpheusMapTypes<'PanoCast', PanoCast>
  | NamedMorpheusMapTypes<'SoundCast', SoundCast>
  | NamedMorpheusMapTypes<'ControlledMovieCast', ControlledMovieCast>
  | NamedMorpheusMapTypes<'MovieCast', MovieCast>

export type MorpheusMap<M extends MorpheusMapDataTypes = MorpheusMapDataTypes> =
  {
    type: M['type']
    data: M['data']
  }
