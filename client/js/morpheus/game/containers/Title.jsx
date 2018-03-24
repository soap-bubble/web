import { connect } from 'react-redux';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Title from '../components/Title';

function mapStateToProps(state) {
  return {
    style: gameSelectors.style(state),
  };
}

export default connect(
  mapStateToProps,
)(Title);
