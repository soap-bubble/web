import {
  display as displayPano,
} from './pano';
import {
  display as displayTransition,
} from './transition';
import {
  SCENE_TYPE_LIST,
} from '../morpheus/scene';

export function display() {
  return (dispatch, getState) => {
    const { scene } = getState();
    const { data: sceneData } = scene;
    const sceneActionMap = {
      panorama: displayPano,
      special: displayTransition,
      transition: displayTransition,
    }
    const sceneType = SCENE_TYPE_LIST[sceneData.sceneType];
    const sceneActionFunction = sceneActionMap[sceneType];
    if (sceneActionFunction) {
      dispatch(sceneActionFunction(sceneData));
    }
  };
}
