import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';
import {
  menuDelegate,
  menuSize,
} from '../selectors';
import {
  browserLoad,
  browserSave,
  cloudSaveNew,
  cloudSave,
  openSave,
  login,
  logout,
} from '../actions';
import {
  closeMenu,
  openSettings,
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
      if (key === 'cloudSaveNew') {
        dispatch(cloudSaveNew());
        dispatch(closeMenu());
      } else if (key === 'cloudSave') {
        dispatch(cloudSave());
        dispatch(closeMenu());
      } else if (key === 'browserLoad') {
        dispatch(browserLoad());
        dispatch(closeMenu());
      } else if (key === 'browserSave') {
        dispatch(browserSave());
        dispatch(closeMenu());
      } else if (key === 'openSave') {
        dispatch(openSave());
        dispatch(closeMenu());
      } else if (key === 'login') {
        dispatch(login());
        dispatch(closeMenu());
      } else if (key === 'logout') {
        dispatch(logout());
      } else if (key === 'settings') {
        dispatch(openSettings());
        dispatch(closeMenu());
      } else {
        dispatch(closeMenu());
      }
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(SelectionList);
