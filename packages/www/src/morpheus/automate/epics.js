import { difference } from "lodash";
import createEpic from "utils/createEpic";
import { Tween, Easing, update as tweenUpdate } from "@tweenjs/tween.js";
import * as sceneSelectors from "morpheus/scene/selectors";
import * as sceneActions from "morpheus/scene/actions";
import * as castActions from "morpheus/casts/actions";
import * as castSelectors from "morpheus/casts/selectors";
import {
  isActive,
  selectors as gamestateSelectors,
  actions as gamestateActions,
} from "morpheus/gamestate";
import { selectors as gameSelectors } from "morpheus/game";
import { special as flatspot } from "morpheus/hotspot";
import { handleEventFactory } from "morpheus/input";
import { gameToScreen } from "utils/coordinates";
import { hotspotRectMatchesPosition } from "morpheus/hotspot/matchers";
import { ACTION_TYPES } from "morpheus/constants";
import { ofType } from "redux-observable";
import { filter, map } from "rxjs/operators";

// FIXME: assume all of these are BROKEN

createEpic((action$, store$) =>
  action$.pipe(
    ofType("AUTO_HOTSPOT_LOOK"),
    filter(({ payload: destSceneId, cb }) => {
      const scene = sceneSelectors.currentSceneData(getState());
      const hotspot = scene.casts.find((cast) => cast.param1 === destSceneId);
      return hotspot;
    }),
    map(({ payload: destSceneId, cb }) => {
      const scene = sceneSelectors.currentSceneData(getState());
      const hotspot = scene.casts.find((cast) => cast.param1 === destSceneId);
      return castActions.forScene(scene).pano.sweepTo(hotspot, cb);
    })
  )
);

function getPositionOfHotspot(hotspot) {
  const { rectTop, rectRight, rectBottom } = hotspot;
  let { rectLeft } = hotspot;
  if (rectLeft > rectRight) {
    rectLeft += 3600;
  }
  return {
    top: rectTop + (rectBottom - rectTop) / 2,
    left: rectLeft + (rectRight - rectLeft) / 2,
  };
}

function inSceneState({ scene, dispatch, getState }) {
  const handleEvent = handleEventFactory();
  const self = {
    async click(position) {
      const hotspots = castSelectors
        .forScene(scene)
        .hotspot.hotspotsData(getState());
      const isPano = castSelectors.forScene(scene).hotspot.isPano(getState());
      const nowInHotspots = scene.casts.filter(
        hotspotRectMatchesPosition(position)
      );
      const enteringHotspots = nowInHotspots;
      const leavingHotspots = [];
      const noInteractionHotspots = difference(hotspots, nowInHotspots);

      await dispatch(
        handleEvent({
          currentPosition: position,
          startingPosition: position,
          hotspots: scene.casts,
          nowInHotspots,
          leavingHotspots,
          enteringHotspots,
          noInteractionHotspots,
          isClick: false,
          isMouseDown: true,
          wasMouseMoved: false,
          wasMouseUpped: false,
          wasMouseDowned: true,
          handleHotspot: isPano
            ? gamestateActions.handlePanoHotspot
            : gamestateActions.handleHotspot,
        })
      );
      await dispatch(
        handleEvent({
          currentPosition: position,
          startingPosition: position,
          hotspots: scene.casts,
          nowInHotspots,
          leavingHotspots,
          enteringHotspots,
          noInteractionHotspots,
          isClick: true,
          isMouseDown: true,
          wasMouseMoved: false,
          wasMouseUpped: true,
          wasMouseDowned: false,
          handleHotspot: isPano
            ? gamestateActions.handlePanoHotspot
            : gamestateActions.handleHotspot,
        })
      );
    },
  };

  return self;
}

createEpic((action$, { dispatch, getState }) =>
  action$
    .pipe(ofType("AUTO_HOTSPOT_GO"))
    .forEach(({ payload: destSceneId, cb }) => {
      const scene = sceneSelectors.currentSceneData(getState());
      const cast = scene.casts.find(
        ({ param1, castId }) => param1 === destSceneId && castId === 0
      );

      if (cast) {
        const position = getPositionOfHotspot(cast);
        inSceneState({ scene, dispatch, getState }).click(position);
        sceneActions.events.on(
          `sceneEnter:${destSceneId}`,
          function handleSceneEnd() {
            sceneActions.events.removeListener(
              `sceneEnter:${destSceneId}`,
              handleSceneEnd
            );
            cb();
          }
        );
      } else {
        cb("nope");
      }
    })
);

createEpic((action$) =>
  action$
    .pipe(ofType("AUTO_SCENE_WAIT"))
    .forEach(({ payload: sceneId, cb }) => {
      sceneActions.events.on(
        `sceneEnter:${sceneId}`,
        function handleSceneEnd() {
          sceneActions.events.removeListener(
            `sceneEnter:${sceneId}`,
            handleSceneEnd
          );
          cb();
        }
      );
    })
);

createEpic((action$, { dispatch, getState }) =>
  action$
    .pipe(ofType("AUTO_SLIDE"))
    .forEach(({ payload: { targetState, targetValue }, cb }) => {
      const width = gameSelectors.width(getState());
      const height = gameSelectors.height(getState());
      const scene = sceneSelectors.currentSceneData(getState());
      const gamestates = gamestateSelectors.forState(getState());
      const targetHotspot = scene.casts.find(
        (cast) =>
          cast.param1 === targetState &&
          isActive({
            cast,
            gamestates,
          })
      );
      if (!targetHotspot) {
        return cb(`Hotspot for gamestate ${targetState} not found`);
      }
      // const mouseHandlers = flatspot({
      //   dispatch,
      //   scene,
      // })
      const location = gameSelectors.location(getState());

      if (ACTION_TYPES[targetHotspot.type] === "VertSlider") {
        const { rectLeft, rectTop, rectRight, rectBottom } = targetHotspot;
        const { value: startingValue, maxValue: startingMaxValue } =
          gamestates.byId(targetState);
        const startingRatio = startingValue / startingMaxValue;
        const endingRatio = targetValue / startingMaxValue;
        const gameLoc = gameToScreen({
          height,
          width,
          left: rectLeft + (rectRight - rectLeft) / 2,
          top: rectTop + startingRatio * (rectBottom - rectTop),
        });
        const loc = {
          clientX: gameLoc.left + location.x,
          clientY: gameLoc.top + location.y,
        };
        const endGameLoc = gameToScreen({
          height,
          width,
          left: rectLeft + (rectRight - rectLeft) / 2,
          top: rectTop + endingRatio * (rectBottom - rectTop),
        });

        const tweenInterval = setInterval(tweenUpdate, 1000 / 30);
        const tween = new Tween(loc)
          .to(
            {
              clientX: endGameLoc.left + location.x,
              clientY: endGameLoc.top + location.y,
            },
            1000
          )
          .easing(Easing.Quadratic.InOut);
        // tween.onUpdate(() => {
        //   mouseHandlers.onMouseMove(loc)
        // })
        // tween.onComplete(() => {
        //   mouseHandlers.onMouseUp(loc)
        //   clearInterval(tweenInterval)
        //   cb()
        // })
        // mouseHandlers.onMouseDown(loc)
        return tween.start();
      } else if (ACTION_TYPES[targetHotspot.type] === "HorizSlider") {
        const { rectLeft, rectTop, rectRight, rectBottom } = targetHotspot;
        const { value: startingValue, maxValue: startingMaxValue } =
          gamestates.byId(targetState);
        const startingRatio = startingValue / startingMaxValue;
        const endingRatio = targetValue / startingMaxValue;
        const gameLoc = gameToScreen({
          height,
          width,
          left: rectLeft + (rectRight - rectLeft) * startingRatio,
          top: rectTop + (rectBottom - rectTop) / 2,
        });
        const loc = {
          clientX: gameLoc.left + location.x,
          clientY: gameLoc.top + location.y,
        };
        const endGameLoc = gameToScreen({
          height,
          width,
          top: rectTop + (rectBottom - rectTop) / 2,
          left: rectLeft + endingRatio * (rectRight - rectLeft),
        });
        const tweenInterval = setInterval(tweenUpdate, 1000 / 30);
        const tween = new Tween(loc)
          .to(
            {
              clientX: endGameLoc.left + location.x,
              clientY: endGameLoc.top + location.y,
            },
            1000
          )
          .easing(Easing.Quadratic.InOut);
        tween.onUpdate(() => {
          mouseHandlers.onMouseMove(loc);
        });
        tween.onComplete(() => {
          mouseHandlers.onMouseUp(loc);
          clearInterval(tweenInterval);
          cb();
        });
        mouseHandlers.onMouseDown(loc);
        mouseHandlers.onMouseMove(loc);
        return tween.start();
      }
      return cb();
    })
);

createEpic((action$, { dispatch }) =>
  action$
    .pipe(ofType("AUTO_GAMESTATE_UPDATE"))
    .forEach(({ payload: { stateId, value }, cb }) => {
      dispatch(gamestateActions.updateGameState(stateId, value));
      cb();
    })
);

createEpic((action$, { getState }) =>
  action$.pipe(ofType("AUTO_SAVE")).forEach(({ cb }) => {
    cb({
      gamestates: gamestateSelectors.gamestates(getState()).toJS(),
      currentSceneId: sceneSelectors.currentSceneId(getState()),
      previousSceneId: sceneSelectors.previousSceneId(getState()),
    });
  })
);

createEpic((action$, { dispatch }) =>
  action$.pipe(ofType("AUTO_LOAD")).forEach(({ payload, cb }) => {
    const { currentSceneId, previousSceneId, gamestates } = payload;
    dispatch(gamestateActions.inject(gamestates));
    dispatch(
      sceneActions.goToScene(currentSceneId, true, previousSceneId)
    ).then(cb);
  })
);
