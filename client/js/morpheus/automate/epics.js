import createEpic from 'utils/createEpic';
import {
  Tween,
  Easing,
  update as tweenUpdate,
} from 'tween';
import * as sceneSelectors from 'morpheus/scene/selectors';
import * as sceneActions from 'morpheus/scene/actions';
import * as castActions from 'morpheus/casts/actions';
import * as castSelectors from 'morpheus/casts/selectors';
import {
  isActive,
  selectors as gamestateSelectors,
  actions as gamestateActions,
} from 'morpheus/gamestate';
import {
  ACTION_TYPES,
} from 'morpheus/constants';

createEpic((action$, { dispatch, getState }) => action$
  .ofType('AUTO_HOTSPOT_LOOK')
  .forEach(({ payload: destSceneId, cb }) => {
    const scene = sceneSelectors.currentSceneData(getState());
    const hotspot = scene.casts.find(cast => cast.param1 === destSceneId);
    if (hotspot) {
      dispatch(castActions.forScene(scene).pano.sweepTo(hotspot, cb));
    }
  }),
);

createEpic((action$, { dispatch, getState }) => action$
  .ofType('AUTO_HOTSPOT_GO')
  .forEach(({ payload: destSceneId, cb }) => {
    const scene = sceneSelectors.currentSceneData(getState());
    const gamestates = gamestateSelectors.forState(getState());
    const cast = scene.casts.find(({ param1 }) => param1 === destSceneId);
    // Find other hotspots that overlap
    const activatedHotspots = scene.casts.filter(
      ({ rectTop, rectLeft, rectRight, rectBottom }) =>
        rectTop === cast.rectTop
        && rectBottom === cast.rectBottom
        && rectLeft === cast.rectLeft
        && rectRight === cast.rectRight,
      );
    if (cast) {
      if (isActive({ cast, gamestates })) {
        const isPano = castSelectors.forScene(scene).hotspot.isPano(getState());
        if (isPano) {
          dispatch(castActions.forScene(scene).hotspot.activated(activatedHotspots));
          // const scene3D = castSelectors.forScene(scene).hotspot.scene3D(getState());
          // dispatch(castActions.forScene(scene).pano.sweepTo(cast, () => {
          //   dispatch(sceneActions.setNextStartAngle(scene3D.rotation.y));
          //   dispatch(sceneActions.goToScene(cast.param1, false))
          //     .then(cb, cb);
          // }));
        } else {
          activatedHotspots.forEach(hotspot => dispatch(
            castActions.forScene(scene).special.handleMouseEvent({
              hotspot,
              type: 'MouseClick',
              top: cast.rectTop + ((cast.rectBottom - cast.rectTop) / 2),
              left: cast.rectLeft + ((cast.rectRight - cast.rectLeft) / 2),
            }),
          ));
          // dispatch(sceneActions.goToScene(cast.param1, cast.dissolveToNextScene))
          //   .then(cb, cb);
        }
        sceneActions.events.on(`sceneEnter:${destSceneId}`, function handleSceneEnd() {
          sceneActions.events.removeListener(`sceneEnter:${destSceneId}`, handleSceneEnd);
          cb();
        });
      } else {
        cb('nope');
      }
    } else {
      cb('nope');
    }
  }),
);

createEpic(action$ => action$
  .ofType('AUTO_SCENE_WAIT')
  .forEach(({ payload: sceneId, cb }) => {
    sceneActions.events.on(`sceneEnter:${sceneId}`, function handleSceneEnd() {
      sceneActions.events.removeListener(`sceneEnter:${sceneId}`, handleSceneEnd);
      cb();
    });
  }),
);

createEpic((action$, { dispatch, getState }) => action$
  .ofType('AUTO_SLIDE')
  .forEach(({ payload: { targetState, targetValue }, cb }) => {
    const scene = sceneSelectors.currentSceneData(getState());
    const gamestates = gamestateSelectors.forState(getState());
    const targetHotspot = scene.casts.find(cast => cast.param1 === targetState && isActive({
      cast,
      gamestates,
    }));
    if (!targetHotspot) {
      return cb();
    }
    if (ACTION_TYPES[targetHotspot.type] === 'VertSlider') {
      const {
        rectLeft,
        rectTop,
        rectRight,
        rectBottom,
      } = targetHotspot;
      const specialActions = castActions.forScene(scene).special;
      const {
        value: startingValue,
        maxValue: startingMaxValue,
      } = gamestates.byId(targetState);
      const startingRatio = startingValue / startingMaxValue;
      const endingRatio = targetValue / startingMaxValue;
      const loc = {
        left: rectLeft + ((rectRight - rectLeft) / 2),
        top: rectTop + (startingRatio * (rectBottom - rectTop)),
      };
      const tweenInterval = setInterval(tweenUpdate, 1000 / 30);
      const tween = new Tween(loc)
        .to({
          left: loc.left,
          top: rectTop + (endingRatio * (rectBottom - rectTop)),
        }, 1000)
        .easing(Easing.Quadratic.InOut);
      tween.onUpdate(() => {
        dispatch(specialActions.handleMouseEvent({
          type: 'MouseStillDown',
          ...loc,
          hotspot: targetHotspot,
        }));
        dispatch(specialActions.update());
      });
      tween.onComplete(() => {
        dispatch(specialActions.handleMouseEvent({
          type: 'MouseUp',
          ...loc,
          hotspot: targetHotspot,
        }));
        scene.casts.forEach(cast => dispatch(specialActions.handleMouseEvent({
          type: 'Always',
          ...loc,
          hotspot: cast,
        })));
        clearInterval(tweenInterval);
        cb();
      });
      dispatch(specialActions.handleMouseEvent({
        type: 'MouseDown',
        ...loc,
        hotspot: targetHotspot,
      }));
      return tween.start();
    }
    return cb();
  }),
);

createEpic((action$, { dispatch }) => action$
  .ofType('AUTO_GAMESTATE_UPDATE')
  .forEach(({ payload: { stateId, value }, cb }) => {
    dispatch(gamestateActions.updateGameState(stateId, value));
    cb();
  }),
);

createEpic((action$, { getState }) => action$
  .ofType('AUTO_SAVE')
  .forEach(({ cb }) => {
    cb({
      gamestates: gamestateSelectors.gamestates(getState()).toJS(),
      currentSceneId: sceneSelectors.currentSceneId(getState()),
      previousSceneId: sceneSelectors.previousSceneId(getState()),
    });
  }),
);

createEpic((action$, { dispatch }) => action$
  .ofType('AUTO_LOAD')
  .forEach(({ payload, cb }) => {
    const {
      currentSceneId,
      previousSceneId,
      gamestates,
    } = payload;
    dispatch(gamestateActions.inject(gamestates));
    dispatch(sceneActions.goToScene(currentSceneId, true, previousSceneId));
    cb();
  }),
);
