import { connect } from 'react-redux';
import qs from 'query-string';
import { login } from 'soapbubble';
import MenuList from '../components/MenuList';
import {
  browserSaveData,
  isOpenSave,
} from '../selectors';
import {
  browserLoad,
  browserSave,
  cloudSaveNew,
  cloudSave,
  openSave,
  login as loginAction,
  logout,
  localLoad,
  localSave,
} from '../actions';
import {
  closeMenu,
  openSettings,
} from '../commands';

import './MenuList.scss';

function mapStateToProps(state) {
  return {
    browserSaveData: browserSaveData(state),
    isOpenSave: isOpenSave(state),
    isLoggedIn: login.selectors.isLoggedIn(state),
  };
}

function mapDispatchToPros(dispatch) {
  return {
    doLogout() {
      dispatch(logout());
    },
    doCloudSave() {
      dispatch(cloudSave());
      dispatch(closeMenu());
    },
    doLogin() {
      dispatch(loginAction());
      dispatch(closeMenu());
    },
    doCloudSaveNew() {
      dispatch(cloudSaveNew());
      dispatch(closeMenu());
    },
    doCloudLoad() {
      dispatch(openSave());
      dispatch(closeMenu());
    },
    doBrowserSave() {
      dispatch(browserSave());
      dispatch(closeMenu());
    },
    doBrowserLoad() {
      dispatch(browserLoad());
      dispatch(closeMenu());
    },
    doLocalLoad({ target: { files } }) {
      const [file] = files;
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          const contents = JSON.parse(e.target.result);
          dispatch(localLoad(contents))
        } catch (err) {
          console.error('Unable to load savefile', err)
        } finally {
          dispatch(closeMenu());
        }
      };
      reader.readAsText(file);
    },
    doLocalSave() {
      dispatch(localSave());
      dispatch(closeMenu());
    },
    doSettings() {
      dispatch(openSettings());
      dispatch(closeMenu());
    },
    doReload() {
      const qp = qs.parse(document.location.search);
      qp.reload = true;
      const newUrl = `${document.location.protocol}//${document.location.host}${document.location.pathname}?${qs.stringify(qp)}`;
      document.location.assign(newUrl);
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(MenuList);
