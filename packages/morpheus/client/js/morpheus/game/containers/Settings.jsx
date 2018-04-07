import { connect } from 'react-redux';
import {
  closeSettings,
} from '../commands';
import Settings from '../components/Settings';

function mapStateToProps(state) {
  return state;
}

function mapDispatchToPros(dispatch) {
  return {
    onClose() {
      dispatch(closeSettings());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(Settings);
