import { connect } from 'react-redux'

import {
  selectors as gameSelectors,
  // @ts-ignore
} from 'morpheus/game'
// @ts-ignore
import { selectors as gamestateSelectors } from 'morpheus/gamestate'
import { Gamestates } from 'morpheus/gamestate/isActive'
import WebGl from '../components/WebGl'

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
}))(WebGl)
