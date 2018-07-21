import { connect } from 'react-redux';
import {
  closeSettings,
  fullscreen,
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
    onFullscreen() {
      dispatch(fullscreen());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(Settings);
