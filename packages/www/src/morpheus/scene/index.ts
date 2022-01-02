import * as matchers from './matchers';
import './epics';
import { Scene } from 'morpheus/casts/types';
export { actions, reducer, selectors } from './ducks';

export const SCENE_TYPE_LIST = {
  1: 'panorama',
  2: 'closeup',
  3: 'special',
  4: 'transition', // These are acutally rolled up into `special`, above
  5: 'helpMenu',
  6: 'credits',
  7: 'finalCredits',
  8: 'title',
};

export function getSceneType(sceneData: Scene) {
  if (!sceneData) return 'none';

  const sceneType = sceneData.sceneType;
  return (SCENE_TYPE_LIST as { [key: number]: string })[sceneType];
}

export { matchers };
