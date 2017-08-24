import * as selectors from './selectors';
import reducer from './reducer';
import * as actions from './actions';

export const SCENE_TYPE_LIST = {
  1: 'panorama',
  2: 'closeup',
  3: 'special',
  4: 'transition', // These are acutally rolled up into `special`, above
  5: 'helpMenu',
  6: 'credits',
  7: 'finalCredits',
};

export function getSceneType(sceneData) {
  if (!sceneData) return 'none';

  const sceneType = sceneData.sceneType;
  return SCENE_TYPE_LIST[sceneType];
}

export {
  selectors,
  reducer,
  actions,
};
