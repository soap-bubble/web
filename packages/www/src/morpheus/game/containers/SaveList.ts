import { connect } from "react-redux";
import { Dispatch } from "redux";
import SaveList from "../components/SaveList";
import * as gameSelectors from "../selectors";
import { cloudLoad } from "../actions";
import { closeSave } from "../commands";

import styles from "./MenuList.module.css";

function mapStateToProps(state: any) {
  const savesAreLoading = gameSelectors.savesAreLoading(state);
  if (savesAreLoading) {
    return {
      loading: savesAreLoading,
    };
  }
  const savesError = gameSelectors.savesMetaError(state);
  if (savesError) {
    return {
      loading: false,
      error: savesError,
    };
  }
  const delegate = gameSelectors.saveDelegate(state);
  const rows = gameSelectors.saveSize(state);
  return {
    delegate,
    rows,
  };
}

function mapDispatchToPros(dispatch: Dispatch) {
  return {
    onSelect(saveId: string) {
      dispatch(cloudLoad(saveId));
      dispatch(closeSave());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(SaveList);
