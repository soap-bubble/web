import { connect, useDispatch, useSelector } from 'react-redux'
import { FC } from 'react'
import { Camera, Object3D } from 'three'

import { selectors as gameSelectors } from 'morpheus/game'
import { selectors as gamestateSelectors } from 'morpheus/gamestate'

import WebGl from '../components/WebGl'
import { Scene } from '../types'

interface ContainerProps {
  stageScenes: Scene[]
  setCamera: (c: Camera | undefined) => void
  setPanoObject: (o: Object3D | undefined) => void
  rotation: { x: number; y: number; offsetX: number }
  enteringScene?: Scene
  exitingScene?: Scene
}

const WebGlContainer: FC<ContainerProps> = ({
  stageScenes,
  setCamera,
  setPanoObject,
  rotation,
  enteringScene,
  exitingScene,
}) => {
  const dispatch = useDispatch()
  const gamestates = useSelector(gamestateSelectors.forState)
  const width = useSelector(gameSelectors.width)
  const height = useSelector(gameSelectors.height)
  const top = useSelector(gameSelectors.top)
  const left = useSelector(gameSelectors.left)
  const volume = useSelector(gameSelectors.htmlVolume)
  return (
    <WebGl
      dispatch={dispatch}
      stageScenes={stageScenes}
      gamestates={gamestates}
      setCamera={setCamera}
      setPanoObject={setPanoObject}
      rotation={rotation}
      volume={volume}
      top={top}
      left={left}
      width={width}
      height={height}
      enteringScene={enteringScene}
      exitingScene={exitingScene}
    />
  )
}

export default WebGlContainer
