import React from 'react'
import Stage from 'morpheus/casts/containers/Stage'
import WebGl from 'morpheus/casts/containers/WebGl'
import { Scene } from '../casts/types'

interface NewGameProps {
  sceneData: Scene
}

const NewGame: React.FC<NewGameProps> = ({ sceneData }) => {
  return <Stage stageScenes={[sceneData]} />
}

export default NewGame
