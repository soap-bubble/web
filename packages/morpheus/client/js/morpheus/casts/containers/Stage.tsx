import { FC } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { selectors as gameSelectors } from 'morpheus/game'
import { selectors as gamestateSelectors } from 'morpheus/gamestate'
import Stage from '../components/Stage'
import { Scene } from '../types'

interface ContainerProps {
  stageScenes: Scene[]
}

const StageContainer: FC<ContainerProps> = ({ stageScenes }) => {
  const dispatch = useDispatch()
  const width = useSelector(gameSelectors.width)
  const height = useSelector(gameSelectors.height)
  const top = useSelector(gameSelectors.top)
  const left = useSelector(gameSelectors.left)
  const volume = useSelector(gameSelectors.htmlVolume)
  const gamestates = useSelector(gamestateSelectors.forState)
  return (
    <Stage
      dispatch={dispatch}
      stageScenes={stageScenes}
      width={width}
      height={height}
      top={top}
      left={left}
      volume={volume}
      gamestates={gamestates}
    />
  )
}

export default StageContainer
