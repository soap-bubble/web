import {
  connect,
} from 'react-redux';
import {
  setPointerCursor,
  setCursorLocationFromPage,
} from '../actions';
import MenuButton from '../components/MenuButton';
import {
  openMenu,
  closeMenu,
} from '../commands';
import {
  menuClosed,
  location,
} from '../selectors';

function mapStateToProps(state) {
  const isMenuClosed = menuClosed(state);
  return {
    isMenuClosed,
    location: location(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onMenuClick(isMenuClosed) {
      dispatch((isMenuClosed ? openMenu : closeMenu)());
    },
    onMouseMove({ pageX, pageY }) {
      dispatch(setPointerCursor());
      dispatch(setCursorLocationFromPage({ pageX, pageY }));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MenuButton);
