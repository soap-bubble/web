import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk'
import {
  closeSettings,
  fullscreen,
} from '../commands';
import Settings from '../components/Settings';

function mapStateToProps(state: any) {
  return state;
}

function mapDispatchToPros(dispatch: ThunkDispatch<any, any, any>) {
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
