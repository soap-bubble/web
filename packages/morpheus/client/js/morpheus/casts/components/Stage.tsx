import React, { useMemo, useEffect } from 'react'
import { Dispatch } from 'redux'
import {
  special as specialInputHandlerFactory,
  eventInterface,
  // @ts-ignore
} from 'morpheus/hotspot'
import { Gamestates } from 'morpheus/gamestate/isActive'
import Canvas from './Canvas'
import Videos, { VideoController, VideoCastRefCallback } from './Videos'
import Images from './Images'
import useComputedStageCast from '../useComputedStageCast'
import useCastRefNoticer from '../useCastRefNoticer'
import { Scene, MovieCast, MovieSpecialCast, Cast } from '../types'

interface StageProps {
  dispatch: Dispatch
  stageScenes: Scene[]
  enteringScene?: Scene
  exitingScene?: Scene
  gamestates: Gamestates
  volume: number
  top: number
  left: number
  width: number
  height: number
}

const Stage = ({
  dispatch,
  width,
  volume,
  height,
  top,
  left,
  gamestates,
  enteringScene,
  exitingScene,
  stageScenes,
}: StageProps) => {
  const [canPlayThroughVideos, onVideoCastCanPlayThrough] = useCastRefNoticer<
    HTMLVideoElement,
    MovieCast
  >()
  const [endedVideos, onVideoCastEnded] = useCastRefNoticer<
    HTMLVideoElement,
    MovieCast
  >()
  const [availableVideos, onVideoCastRef] = useCastRefNoticer<
    VideoController,
    MovieSpecialCast
  >()
  const [imagesLoaded, onImageLoad] = useCastRefNoticer<
    HTMLImageElement,
    MovieCast
  >()
  const [imagesErrored, onImageError] = useCastRefNoticer<
    HTMLImageElement,
    MovieCast
  >()

  const {
    imageCasts,
    videoCasts,
    enteringRenderables,
    stageRenderables,
    exitingRenderables,
  } = useComputedStageCast(
    gamestates,
    width,
    height,
    imagesLoaded,
    availableVideos,
    stageScenes,
    enteringScene,
    exitingScene,
    [canPlayThroughVideos, endedVideos, imagesErrored],
  )

  const specialHandler = useMemo(
    () =>
      eventInterface.touchDisablesMouse(
        specialInputHandlerFactory({
          dispatch,
          scene: stageScenes[0],
        }),
      ),
    [stageScenes[0]],
  )
  return (
    <React.Fragment>
      <Canvas
        width={width}
        height={height}
        top={top}
        left={left}
        enteringRenderables={enteringRenderables}
        stageRenderables={stageRenderables}
        exitingRenderables={exitingRenderables}
        onMouseDown={specialHandler.onMouseDown}
        onMouseMove={specialHandler.onMouseMove}
        onMouseUp={specialHandler.onMouseUp}
        onTouchStart={specialHandler.onTouchStart}
        onTouchMove={specialHandler.onTouchMove}
        onTouchEnd={specialHandler.onTouchEnd}
        onTouchCancel={specialHandler.onTouchCancel}
      />
      <Videos
        movieSpecialCasts={videoCasts}
        volume={volume}
        onVideoCastEnded={onVideoCastEnded}
        onVideoCastCanPlaythrough={onVideoCastCanPlayThrough}
        onVideoCastRef={onVideoCastRef}
      />
      <Images
        movieSpecialCasts={imageCasts}
        onImageCastLoad={onImageLoad}
        onImageCastError={onImageError}
      />
    </React.Fragment>
  )
}

export default Stage
