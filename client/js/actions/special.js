
import {
  resize,
} from './dimensions';
import {
  load as loadHotspots,
} from './hotspots';
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
    const hotspotsData = casts.filter(c => c.castId === 0);
    const url = `${getAssetUrl(`${rootCast.fileName}`)}.png`;
    dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    dispatch(loadHotspots());
    dispatch({
      type: SPECIAL_START,
      payload: sceneData,
      meta: {
        url,
        hotspotsData,
      },
    });
  };
}
