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
import { ThunkDispatch } from 'redux-thunk';

function mapStateToProps(state: any) {
  const isMenuClosed = menuClosed(state);
  return {
    isMenuClosed,
    location: location(state),
  };
}

function mapDispatchToProps(dispatch: ThunkDispatch<any, any, any>) {
  return {
    onMenuClick(isMenuClosed: boolean) {
      dispatch((isMenuClosed ? openMenu : closeMenu)());
    },
    onMouseMove({ pageX, pageY }: any) {
      dispatch(setPointerCursor());
      dispatch(setCursorLocationFromPage({ pageX, pageY }));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MenuButton);
