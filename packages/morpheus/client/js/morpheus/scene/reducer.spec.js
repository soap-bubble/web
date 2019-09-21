import reducer from './reducer'
import './__fixtures__/matchers'

import {
  SET_NEXT_START_ANGLE,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_SET_BACKGROUND_SCENE,
  SCENE_DO_ENTERING,
  SCENE_DO_EXITING,
  SCENE_ENTER_DONE,
} from './actionTypes'

describe('morpheus/scene/reducer', () => {
  describe(SET_NEXT_START_ANGLE, () => {
    it('does nothing on undefined', () => {
      const oldState = reducer(undefined, {})
      const state = reducer(oldState, {
        type: SET_NEXT_START_ANGLE,
        payload: undefined,
      })
      expect(state).toEqual(oldState)
    })
    it('sets on a value', () => {
      const state = reducer(undefined, {
        type: SET_NEXT_START_ANGLE,
        payload: 100,
      })
      expect(state).toBeNextSceneStartAngle(100)
    })
  })
  describe(SCENE_LOAD_START, () => {
    it('empty', () => {
      expect(reducer()).toHaveLoadedScenes(0)
      expect(reducer()).toHaveLoadingScenes(0)
    })
    it('Adds scene to cache if it is not already there', () => {
      const state = reducer(undefined, {
        type: SCENE_LOAD_START,
        payload: 100,
      })
      expect(state).toHaveLoadingScenes(1)
    })

    it('does not add scene to cache if it is already there', () => {
      let scene = reducer(undefined, {
        type: SCENE_LOAD_START,
        payload: 100,
      })
      expect(scene).toHaveLoadingScenes(1)
      scene = reducer(scene, {
        type: SCENE_LOAD_START,
        payload: 100,
      })
      expect(scene).toHaveLoadingScenes(1)
    })
  })
  describe(SCENE_LOAD_COMPLETE, () => {
    it('sets a scene to loaded', () => {
      let scene = reducer(undefined, {
        type: SCENE_LOAD_START,
        payload: 100,
      })
      expect(scene).toHaveLoadingScenes(1)
      scene = reducer(scene, {
        type: SCENE_LOAD_COMPLETE,
        payload: {
          sceneId: 100,
        },
      })
      expect(scene).toHaveLoadingScenes(0)
      expect(scene).toHaveLoadedScenes(1)
    })
  })
  describe(SCENE_SET_BACKGROUND_SCENE, () => {
    it('sets the background scene', () => {
      const foo = {
        sceneId: 100,
      }
      const scene = reducer(undefined, {
        type: SCENE_SET_BACKGROUND_SCENE,
        payload: foo,
      })
      expect(scene).toHaveBackgroundScene(100)
      expect(scene).toHaveBackgroundScene(foo)
    })
  })

  describe(SCENE_DO_EXITING, () => {
    it('set dissolve to true if undefined', () => {
      const scene = reducer(undefined, {
        type: SCENE_DO_EXITING,
        payload: {},
      })
      expect(scene).toHaveDissolve(true)
    })
  })
  it('set dissolve to true if true', () => {
    const scene = reducer(undefined, {
      type: SCENE_DO_EXITING,
      payload: {
        dissolve: true,
      },
    })
    expect(scene).toHaveDissolve(true)
  })
  it('set dissolve to false if false', () => {
    const scene = reducer(undefined, {
      type: SCENE_DO_EXITING,
      payload: {
        dissolve: false,
      },
    })
    expect(scene).toHaveDissolve(false)
  })

  describe(SCENE_ENTER_DONE, () => {
    it('isLive', () => {
      const scene = reducer(undefined, {
        type: SCENE_ENTER_DONE,
      })
      expect(scene).toBeLive()
    })
  })
})
