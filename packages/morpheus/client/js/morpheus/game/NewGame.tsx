import React from 'react'
import Stage from 'morpheus/casts/containers/Stage'
import WebGl from 'morpheus/casts/containers/WebGl'
import { Scene } from '../casts/types'

interface NewGameProps {
  sceneData: Scene
}

const NewGame: React.FC<NewGameProps> = ({ sceneData }) => {
  return <WebGl stageScenes={[sceneData]} />
}

export default NewGame
