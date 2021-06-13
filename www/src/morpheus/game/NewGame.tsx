import React from 'react'
import Stage from 'morpheus/casts/containers/Stage'
import { Scene } from '../casts/types'

interface NewGameProps {
  stageScenes: Scene[]
}

const NewGame: React.FC<NewGameProps> = ({ stageScenes }) => {
  return <Stage stageScenes={stageScenes} />
}

export default NewGame
