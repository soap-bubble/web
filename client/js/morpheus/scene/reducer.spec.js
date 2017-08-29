import reducer from './reducer';
import './matchers';

import {
  SET_NEXT_START_ANGLE,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_DO_ENTER,
} from './actionTypes';

describe('morpheus/scene/reducer', () => {
  describe(SET_NEXT_START_ANGLE, () => {
    it('does nothing on undefined', () => {
      const oldState = reducer(undefined, 'scene', {});
      const state = reducer(oldState, 'scene', {
        type: SET_NEXT_START_ANGLE,
        payload: undefined,
      });
      expect(state).toEqual(oldState);
    });
    it('sets on a value', () => {
      const state = reducer(undefined, 'scene', {
        type: SET_NEXT_START_ANGLE,
        payload: 100,
      });
      expect(state).toBeNextSceneStartAngle(100);
    });
  });
  describe(SCENE_LOAD_START, () => {
    it('empty', () => {
      expect(reducer()).toHaveLoadedScenes(0);
      expect(reducer()).toHaveLoadingScenes(0);
    });
    it('Adds scene to cache if it is not already there', () => {
      const state = reducer(undefined, 'scene', {
        type: SCENE_LOAD_START,
        payload: 100,
      });
      expect(state).toHaveLoadingScenes(1);
    });

    it('does not add to scene to cache if it is already there', () => {
      let scene = reducer(undefined, 'scene', {
        type: SCENE_LOAD_START,
        payload: 100,
      });
      expect(scene).toHaveLoadingScenes(1);
      scene = reducer({
        scene,
      }, 'scene', {
        type: SCENE_LOAD_START,
        payload: 100,
      });
      expect(scene).toHaveLoadingScenes(1);
    });
  });
  describe(SCENE_LOAD_COMPLETE, () => {
    it('sets a scene to loaded', () => {
      let scene = reducer(undefined, 'scene', {
        type: SCENE_LOAD_START,
        payload: 100,
      });
      expect(scene).toHaveLoadingScenes(1);
      scene = reducer({ scene }, 'scene', {
        type: SCENE_LOAD_COMPLETE,
        payload: {
          sceneId: 100,
        },
      });
      expect(scene).toHaveLoadingScenes(0);
      expect(scene).toHaveLoadedScenes(1);
    });
  });
  describe(SCENE_SET_BACKGROUND_SCENE, () => {
    it('sets the background scene', () => {
      const foo = {
        sceneId: 100,
      };
      const scene = reducer(undefined, 'scene', {
        type: SCENE_SET_BACKGROUND_SCENE,
        payload: foo,
      });
      expect(scene).toHaveBackgroundScene(100);
      expect(scene).toHaveBackgroundScene(foo);
    });
  });

  describe(SCENE_DO_ENTERING, () => {
    it('sets the background scene', () => {
      const foo = {
        sceneId: 100,
      };
      const scene = reducer(undefined, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: foo,
      });
      expect(scene).toHaveCurrentScene(100);
      expect(scene).toHaveCurrentScene(foo);
    });

    it('sets the previous scene', () => {
      const first = {
        sceneId: 100,
      };
      const second = {
        sceneId: 200,
      };
      let scene = reducer(undefined, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: first,
      });
      scene = reducer({ scene }, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: second,
      });
      expect(scene).toHaveCurrentScene(second);
      expect(scene).toHavePreviousScene(first);
      expect(scene).toHaveCurrentScenes(2);
    });

    it('currentScenes can only have 3', () => {
      const first = {
        sceneId: 100,
      };
      const second = {
        sceneId: 200,
      };
      const third = {
        sceneId: 200,
      };
      const fourth = {
        sceneId: 200,
      };
      let scene = reducer(undefined, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: first,
      });
      expect(scene).toHaveCurrentScenes(1);
      expect(scene).toHaveCurrentScenes([first]);
      scene = reducer({ scene }, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: second,
      });
      expect(scene).toHaveCurrentScenes(2);
      expect(scene).toHaveCurrentScenes([first, second]);
      scene = reducer({ scene }, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: third,
      });
      expect(scene).toHaveCurrentScenes(3);
      expect(scene).toHaveCurrentScenes([first, second, third]);
      scene = reducer({ scene }, 'scene', {
        type: SCENE_DO_ENTERING,
        payload: fourth,
      });
      expect(scene).toHaveCurrentScenes(3);
      expect(scene).toHaveCurrentScenes([second, third, fourth]);
    });
  });

  describe(SCENE_DO_EXITING, () => {
    it('set dissolve to true if undefined', () => {
      const scene = reducer(undefined, 'scene', {
        type: SCENE_DO_EXITING,
      });
      expect(scene).toHaveDissolve(true);
    });
  });
  it('set dissolve to true if true', () => {
    const scene = reducer(undefined, 'scene', {
      type: SCENE_DO_EXITING,
      dissolve: true,
    });
    expect(scene).toHaveDissolve(true);
  });
  it('set dissolve to false if false', () => {
    const scene = reducer(undefined, 'scene', {
      type: SCENE_DO_EXITING,
      dissolve: false,
    });
    expect(scene).toHaveDissolve(false);
  });

  describe(SCENE_DO_ENTER, () => {
    it('isLive', () => {
      const scene = reducer(undefined, 'scene', {
        type: SCENE_DO_ENTER,
      });
      expect(scene).toBeLive();
    });
  });
});
