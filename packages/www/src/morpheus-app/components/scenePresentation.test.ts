import { describe, expect, it } from 'vitest';

import {
  areRequiredRenderersReady,
  getScenePresentationRenderers,
} from 'morpheus/casts/presentation';
import type {
  ControlledMovieCast,
  MovieSpecialCast,
  PanoCast,
  Scene,
} from 'morpheus/casts/types';
import type { Gamestates } from 'morpheus/gamestate/isActive';

const gamestates: Gamestates = {
  byId: () => {
    throw new Error('No comparator should read gamestate in this test');
  },
};

const panoCast: PanoCast = {
  __t: 'PanoCast',
  castId: 1,
  initiallyEnabled: true,
  comparators: [],
  fileName: 'pano',
  url: '',
  audioOnly: false,
  width: 3072,
  height: 600,
  location: { x: 0, y: 0 },
};

const movieCast: MovieSpecialCast = {
  __t: 'MovieSpecialCast',
  castId: 2,
  initiallyEnabled: true,
  comparators: [],
  fileName: 'movie',
  url: '',
  audioOnly: false,
  width: 320,
  height: 200,
  location: { x: 0, y: 0 },
  startFrame: 0,
  endFrame: 10,
  looping: false,
  dissolveToNextScene: false,
  nextSceneId: 0,
  angleAtEnd: 0,
  image: false,
  actionAtEnd: 0,
};

const controlledCast: ControlledMovieCast = {
  __t: 'ControlledMovieCast',
  castId: 3,
  initiallyEnabled: true,
  comparators: [],
  fileName: 'controlled',
  url: '',
  audioOnly: false,
  width: 64,
  height: 64,
  location: { x: 0, y: 0 },
  controlledLocation: { x: 0, y: 0 },
  companionMovieCastId: 0,
  scale: 1,
  controlledMovieCallbacks: [],
};

function sceneWith(...casts: Scene['casts']): Scene {
  return {
    sceneId: 100,
    cdFlags: 0,
    sceneType: 0,
    palette: 0,
    casts,
  };
}

describe('scene presentation renderers', () => {
  it('requires both renderers for an active mixed pano and special scene', () => {
    expect(
      getScenePresentationRenderers(sceneWith(panoCast, movieCast), gamestates),
    ).toEqual(new Set(['webgl', 'special']));
  });

  it('treats controlled movie images as special presentation content', () => {
    expect(
      getScenePresentationRenderers(sceneWith(controlledCast), gamestates),
    ).toEqual(new Set(['special']));
  });

  it('does not wait for audio-only special casts', () => {
    expect(
      getScenePresentationRenderers(
        sceneWith({ ...movieCast, audioOnly: true }),
        gamestates,
      ),
    ).toEqual(new Set());
  });

  it('reports readiness only after every required renderer responds', () => {
    const required = new Set(['webgl', 'special'] as const);

    expect(areRequiredRenderersReady(required, new Set(['webgl']))).toBe(false);
    expect(
      areRequiredRenderersReady(required, new Set(['webgl', 'special'])),
    ).toBe(true);
  });
});
