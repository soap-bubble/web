import { connect } from 'react-redux'

import {
  selectors as gameSelectors,
  // @ts-ignore
} from 'morpheus/game'
// @ts-ignore
import { selectors as gamestateSelectors } from 'morpheus/gamestate'
import { Gamestates } from 'morpheus/gamestate/isActive'
import Stage from '../components/Stage'

interface StateProps {
  width: number
  height: number
  volume: number
  style: object
  gamestates: Gamestates
}

export default connect<StateProps>(state => ({
  width: gameSelectors.width(state),
  height: gameSelectors.height(state),
  style: gameSelectors.style(state),
  volume: gameSelectors.htmlVolume(state),
  gamestates: gamestateSelectors.forState(state),
}))(Stage)
