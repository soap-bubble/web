import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';
import {
  menuDelegate,
  menuSize,
} from '../selectors';
import {
  saveGame,
  loadGame,
} from '../actions';
import {
  closeMenu,
} from '../commands';

import './MenuList.scss';

function mapStateToProps(state) {
  const delegate = menuDelegate(state);
  const rows = menuSize(state);
  return {
    delegate,
    rows,
  };
}

function mapDispatchToPros(dispatch) {
  return {
    onSelect(key) {
      if (key === 'save') {
        dispatch(saveGame());
        dispatch(closeMenu());
      } else if (key === 'load') {
        dispatch(loadGame());
        dispatch(closeMenu());
      }
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(SelectionList);