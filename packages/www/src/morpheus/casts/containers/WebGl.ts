import { connect } from 'react-redux';

import {
  selectors as gameSelectors,
  // @ts-ignore
} from 'morpheus/game';
// @ts-ignore
import { selectors as gamestateSelectors } from 'morpheus/gamestate';
import { Gamestates } from 'morpheus/gamestate/isActive';
import WebGl from '../components/WebGl';

interface StateProps {
  volume: number;
  gamestates: Gamestates;
}

export default connect<StateProps>((state) => ({
  volume: gameSelectors.htmlVolume(state),
  gamestates: gamestateSelectors.forState(state),
}))(WebGl);
