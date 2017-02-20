
import {
  resize,
} from './dimensions';
import {
  getAssetUrl,
} from '../service/gamedb';
import {
  SPECIAL_START,
  SPECIAL_IS_LOADED,
  SPECIAL_END,
} from './types';

export function specialImgIsLoaded() {
  return {
    type: SPECIAL_IS_LOADED,
  };
}

export function display(sceneData) {
  return (dispatch) => {
    const { casts } = sceneData;
    const rootCast = casts.find(c => c.castId === sceneData.sceneId);
    const url = `${getAssetUrl(`${rootCast.fileName}`)}.png`;
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch({
      type: SPECIAL_START,
      payload: sceneData,
      meta: url,
    });
  };
}
