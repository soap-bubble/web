import { connect } from 'react-redux';
import { selectors } from '../index';

function mapStateToPros(state) {
  return {
    isLoginStarted: selectors.isLoginStarted(state),
  };
}
