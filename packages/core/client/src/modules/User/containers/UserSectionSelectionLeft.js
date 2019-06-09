import { connect } from 'react-redux';
import * as User from '../../User';
import SelectionList from '../../../components/SelectionList';

function mapStateToProps(state, {
  activeKey: startKey,
}) {
  const delegate = User.selectors.delegate(state);
  const rowData = User.selectors.rowData(state);
  return {
    delegate,
    startKey,
    rowData,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSelect(selectedSection) {

    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SelectionList);

export default SettingsLeftPanel;
