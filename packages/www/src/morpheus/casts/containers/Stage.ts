import { connect } from 'react-redux'
import { selectors as inputSelectors } from 'morpheus/input'
import { selectors as gameSelectors } from 'morpheus/game'
import { selectors as gamestateSelectors } from 'morpheus/gamestate'
import { Gamestates } from 'morpheus/gamestate/isActive'
import Stage from '../components/Stage'

interface StateProps {
  width: number
  height: number
  volume: number
  top: number
  left: number
  gamestates: Gamestates
}

export default connect<StateProps>(state => ({
  width: gameSelectors.width(state),
  height: gameSelectors.height(state),
  top: gameSelectors.top(state),
  left: gameSelectors.left(state),
  volume: gameSelectors.htmlVolume(state),
  gamestates: gamestateSelectors.forState(state),
}))(Stage)
