import { connect } from 'react-redux';
import {
  isLeaving,
  isDone,
  titleStyle,
} from '../selectors';
import Main from '../components/Main';

function mapStateToProps(state) {
  return {
    leaving: isLeaving(state),
    done: isDone(state),
    style: titleStyle(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onFullscreen() {
      if (root.requestFullscreen) {
        root.requestFullscreen();
      } else if (root.webkitRequestFullScreen) {
        root.webkitRequestFullScreen();
        root.style.width = '100%';
        root.style.height = '100%';
      }
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Main);
