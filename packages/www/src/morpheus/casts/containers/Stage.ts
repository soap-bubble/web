import { connect } from 'react-redux';
import { selectors as inputSelectors } from 'morpheus/input';
import { selectors as gameSelectors } from 'morpheus/game';
import { selectors as gamestateSelectors } from 'morpheus/gamestate';
import { Gamestates } from 'morpheus/gamestate/isActive';
import Stage from '../components/Stage';

export default connect((state) => ({
  volume: gameSelectors.htmlVolume(state),
  gamestates: gamestateSelectors.forState(state),
}))(Stage);
