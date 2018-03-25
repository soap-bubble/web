import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Background from '../components/Background';

function mapStateToProps(state) {
  return {
    style: gameSelectors.style(state),
  };
}

export default connect(
  mapStateToProps,
)(Background);
