import {
  connect,
  ConnectedProps,
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
import { ComponentType } from 'react';

type State = any

function mapStateToProps(state: State) {
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

const connector = connect(mapStateToProps, mapDispatchToProps)

export type MenuButtonProps = ConnectedProps<typeof connector>

type ConnectedMenuButtonComponent = ComponentType<MenuButtonProps>
const ConnectedMenuButton = connector(MenuButton) as ConnectedMenuButtonComponent

export default ConnectedMenuButton
