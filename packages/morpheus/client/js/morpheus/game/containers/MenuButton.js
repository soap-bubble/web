import {
  connect,
} from 'react-redux';
import MenuButton from '../components/MenuButton';
import {
  openMenu,
  closeMenu,
} from '../commands';
import {
  menuClosed,
} from '../selectors';

function mapStateToProps(state) {
  const isMenuClosed = menuClosed(state);
  return {
    isMenuClosed,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onMenuClick(isMenuClosed) {
      dispatch((isMenuClosed ? openMenu : closeMenu)());
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MenuButton);
