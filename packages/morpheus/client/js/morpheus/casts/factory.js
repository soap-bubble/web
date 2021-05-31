import React from 'react'
import { head, once, tail, reverse, wrap } from 'lodash'
import { Main } from 'morpheus/title'
import { createSelector } from 'reselect'
import { selectors as sceneSelectors, getSceneType } from 'morpheus/scene'
import './modules'

import { decorate as faderDecorator } from './components/Fader'
import Pano from './components/WebGl'
import Sound from './components/Sound'
import Stage from './components/Stage'

function createSceneMapper(map) {
  return sceneData => map[getSceneType(sceneData)]
}

export const createLiveSceneSelector = createSceneMapper({
  panorama: Pano,
  special: Stage,
  title: Main,
})

export const createEnteringSceneSelector = createSceneMapper({
  panorama: Pano,
  special: Stage,
})

export const createExitingSceneSelector = createSceneMapper({
  panorama: Pano,
  special: Stage,
  title: Main,
})

// wrap...once creates a lazy init selector to break a circular dependency
export default wrap(
  once(() =>
    createSelector(
      sceneSelectors.currentScenesData,
      sceneSelectors.isEntering,
      sceneSelectors.isLive,
      sceneSelectors.isExiting,
      sceneSelectors.dissolve,
      (_currentScenes, _isEntering, _isLive, _isExiting, dissolve) => {
        const currentScenes = _currentScenes.toJS()
        let scenes = []
        const current = head(currentScenes)
        const previouses = reverse(tail(currentScenes))
        const CurrentScene = createLiveSceneSelector(current)
        const EnteringScene = createEnteringSceneSelector(current)
        const CurrentExitingScene = createExitingSceneSelector(current)
        const PreviousScenes = previouses.map(createExitingSceneSelector)
        let previousScene
        if (PreviousScenes.length) {
          previousScene = PreviousScenes.map((PreviousScene, index) => (
            <PreviousScene
              key={`scene${previouses[index].sceneId}`}
              scene={previouses[index]}
            />
          ))
          scenes = scenes.concat(previousScene)
        }
        if (_isLive && CurrentScene) {
          if (previousScene && dissolve) {
            const Fader = faderDecorator(<CurrentScene scene={current} />)
            scenes.push(<Fader key={`scene${current.sceneId}`} />)
          } else {
            scenes.push(
              <CurrentScene key={`scene${current.sceneId}`} scene={current} />,
            )
          }
        }
        if (_isEntering && EnteringScene) {
          scenes.push(
            <EnteringScene key={`scene${current.sceneId}`} scene={current} />,
          )
        }
        if (_isExiting && CurrentExitingScene) {
          scenes.push(
            <CurrentExitingScene
              key={`scene${current.sceneId}`}
              scene={current}
            />,
          )
        }
        scenes.push(<Sound key="sound" scene={current} />)
        return scenes
      },
    ),
  ),
  (selectorFactory, state) => selectorFactory()(state),
)
