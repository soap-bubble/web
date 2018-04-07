import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Background from '../components/Background';

function mapStateToProps(state, { opacity }) {
  return {
    style: gameSelectors.style(state),
    opacity,
  };
}

export default connect(
  mapStateToProps,
)(Background);
