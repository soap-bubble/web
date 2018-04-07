import { connect } from 'react-redux';
import SaveList from '../components/SaveList';
import * as gameSelectors from '../selectors';
import {
  cloudLoad,
} from '../actions';

import './MenuList.scss';

function mapStateToProps(state) {
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

function mapDispatchToPros(dispatch) {
  return {
    onSelect(saveId) {
      dispatch(cloudLoad(saveId));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToPros)(SaveList);
