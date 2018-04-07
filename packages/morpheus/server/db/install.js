import { values, set } from 'lodash';

export const classes = {};

export default function install(db, {
  Cast,
  ControlledMovieCast,
  HotSpot,
  MovieCast,
  MovieSpecialCast,
  PanoAnim,
  PanoCast,
  PreloadCast,
  SoundCast,
  GameState,
  Scene,
}) {
  function apply(name, Class) {
    const model = db.model(name, new Class());
    set(classes, name, model);
    return model;
  }
  function discriminate(Parent, name, Class) {
    const model = Parent.discriminator(name, new Class());
    set(classes, name, model);
    return model;
  }

  const cast = apply('Cast', Cast);
  discriminate(cast, 'ControlledMovieCast', ControlledMovieCast);
  discriminate(cast, 'HotSpot', HotSpot);
  discriminate(cast, 'MovieCast', MovieCast);
  discriminate(cast, 'MovieSpecialCast', MovieSpecialCast);
  discriminate(cast, 'PanoAnim', PanoAnim);
  discriminate(cast, 'PanoCast', PanoCast);
  discriminate(cast, 'PreloadCast', PreloadCast);
  discriminate(cast, 'SoundCast', SoundCast);

  apply('GameState', GameState);
  apply('Scene', Scene);
}

export function get(className) {
  if (typeof className === 'undefined') {
    return values(classes);
  }

  return classes[className];
}
