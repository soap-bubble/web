import createEpic from 'utils/createEpic';
import * as sceneSelectors from 'morpheus/scene/selectors';
import * as castActions from 'morpheus/casts/actions';

createEpic((action$, { dispatch, getState }) => action$
  .ofType('AUTO_SWEEP_TO_HOTSPOT')
  .subscribe(({ payload: destSceneId }) => {
    const scene = sceneSelectors.currentSceneData(getState());
    const hotspot = scene.casts.find(cast => cast.param1 === destSceneId);
    if (hotspot) {
      dispatch(castActions.forScene(scene).pano.sweepTo(hotspot, () => {}));
    }
  }),
);
