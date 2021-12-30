import { Matcher, and, not } from "../../utils/matchers";
import {
  Cast,
  ControlledMovieCast,
  Morpheus,
  MovieCast,
  Hotspot,
  MovieSpecialCast,
  Scene,
} from "./types";
import { isActive, Gamestates } from "morpheus/gamestate/isActive";

export const isPano = (sceneData: Scene) => {
  const { casts } = sceneData;
  return !!casts.find((c: Morpheus) => c.__t === "PanoCast");
};

export function forMorpheusType(type: string) {
  return (c: Morpheus) => c.__t === type;
}

export const isHotspot = (c: Cast | Hotspot) => c.castId === 0;

export const isAudio = (cast: MovieCast) => cast.audioOnly;

export const isControlledCast = and<ControlledMovieCast>(
  forMorpheusType("ControlledMovieCast"),
  not<ControlledMovieCast>(isAudio)
);

export const isImage = (cast: MovieSpecialCast) => cast.image;

export const isMovie = and(
  forMorpheusType("MovieSpecialCast"),
  and(not(isAudio), not(isImage))
) as Matcher<Cast>;

export function isActiveSound({
  casts,
  gamestates,
}: {
  casts: Cast[];
  gamestates: Gamestates;
}) {
  return casts.filter((cast) => {
    if (forMorpheusType("SoundCast")(cast)) {
      if (cast.comparators.length) {
        return isActive({ cast, gamestates });
      }
      return true;
    }
    return false;
  });
}

export function isEmptySoundCast({
  casts,
  gamestates,
}: {
  casts: Cast[];
  gamestates: Gamestates;
}) {
  const soundCastData = isActiveSound({
    casts,
    gamestates,
  });
  return (
    soundCastData.length &&
    !casts.some(
      (cast) =>
        ["PanoCast", "ControlledMovieCast", "MovieSpecialCast"].indexOf(
          cast.__t
        ) !== -1
    )
  );
}

export type { Matcher };
