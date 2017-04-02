import * as v0 from './morpheus_v0';

function v1(Class) {
  return class extends Class {
    constructor(opts) {
      super(opts, {
        versionKey: 1,
      });
    }
  }
}

export const Morpheus = v0.Morpheus;
export const Cast = v0.Cast;
export const GameState = v0.GameState;
export const HotSpot = v0.HotSpot;
export const MovieCast = v0.MovieCast;
export const ControlledMovieCast = v1(class extends v0.ControlledMovieCast {
  constructor(opts) {
    super(opts);
    this.add({
      atlas: Boolean,
    });
  }
});
export const PanoAnim = v0.PanoAnim;
export const MovieSpecialCast = v0.MovieSpecialCast;
export const PanoCast = v0.MovieCast;
export const PreloadCast = v0.PreloadCast;
export const SoundCast = v0.SoundCast;
export const Scene = v0.Scene;
