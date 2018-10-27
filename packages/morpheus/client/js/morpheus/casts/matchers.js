import {
  and,
} from 'utils/matchers';

export const isPano = (sceneData) => {
  const { casts } = sceneData;
  return !!(casts.find(c => c.__t === 'PanoCast'));
};

export function forMorpheusType(type) {
  return c => c.__t === type;
}

export const isHotspot = c => c.castId === 0;

export const isMovie = and(
  forMorpheusType('MovieSpecialCast'),
  c =>
    !c.audioOnly
    && !c.image,
);

export const isAudio = cast => cast.audioOnly;
