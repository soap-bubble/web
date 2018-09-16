import {
  memoize,
} from 'lodash';
import { createSelector } from 'reselect';
import {
  selectors as panoSelectors,
} from 'morpheus/casts/modules/pano';
import {
  lifecycle,
} from 'morpheus/casts/actions';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import {
  isActive,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import createLoader from 'utils/loader';
import {
  ACTION_TYPES,
} from 'morpheus/constants';

export const selectors = memoize((scene) => {
  const sceneToLoad = (cast) => {
    const {
      type,
    } = cast;
    const actionType = ACTION_TYPES[type];
    switch (actionType) {
      case 'DissolveTo':
      case 'ChangeScene': {
        const { param1: nextSceneId } = cast;
        return nextSceneId;
      }
      default:
        return null;
    }
  };
  const selectCastsToLoad = createSelector(
    () => scene.casts,
    gamestateSelectors.forState,
    (casts, gamestates) => casts.filter(cast => isActive({
      cast,
      gamestates,
    })),
  );
  const selectNewScenesToLoad = scenesToLoad => scene.casts
    .map(sceneToLoad)
    .filter(sceneId =>
      sceneId && !scenesToLoad.find(
        s => s.id === sceneId,
      ),
    );
  return {
    castsToLoad: selectCastsToLoad,
    newScenesToLoad: selectNewScenesToLoad,
    sceneToLoad,
  };
});

const loader = createLoader();

export const delegate = memoize((scene) => {
  const preloadSelectors = selectors(scene);
  return {
    applies() {
      return true;
    },
    update(position) {
      return (dispatch, getState) => {
        // const angle = panoSelectors(scene).rotation(getState());
        // console.log(angle.y, position);
        loader.load({
          item: scene,
          filter: ({ toLoad }) => preloadSelectors.newScenesToLoad(toLoad),
          loader: async ({ id }) => {
            const sceneToLoad = await dispatch(sceneActions.fetch(id));
            await dispatch(lifecycle.doLoad(sceneToLoad));
            console.log(`Preloaded ${id}`);
          },
        });
      };
    },
  };
});