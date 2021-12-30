import { connect } from "react-redux";
import { Action } from "redux";
import qs from "query-string";
import MenuList from "../components/MenuList";
import { browserSaveData, isOpenSave, isLoggedIn } from "../selectors";
import {
  browserLoad,
  browserSave,
  cloudSaveNew,
  cloudSave,
  openSave,
  localLoad,
  localSave,
  loginAction,
  logoutAction,
} from "../actions";
import { closeMenu, openSettings } from "../commands";

import styles from "./MenuList.module.css";
import { ThunkDispatch } from "redux-thunk";

function mapStateToProps(state: any) {
  return {
    browserSaveData: browserSaveData(),
    isOpenSave: isOpenSave(state),
    isLoggedIn: isLoggedIn(state),
  };
}

function mapDispatchToPros(dispatch: ThunkDispatch<any, any, Action>) {
  return {
    doLogout() {
      dispatch(logoutAction());
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
    doLocalLoad({ target: { files } }: any) {
      const [file] = files;
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        if (e.target && e.target.result) {
          try {
            const contents = JSON.parse(e.target.result.toString());
            dispatch(localLoad(contents));
          } catch (err) {
            console.error("Unable to load savefile", err);
          } finally {
            dispatch(closeMenu());
          }
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
      const newUrl = `${document.location.protocol}//${document.location.host}${
        document.location.pathname
      }?${qs.stringify({
        ...qp,
        reload: true,
      })}`;
      document.location.assign(newUrl);
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(MenuList);
