import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';
import { selectors as usersSelectors } from 'app/modules/users';

function mapStateToProps(state, {
  activeKey: startKey,
}) {
  const delegate = usersSelectors.userListDelegate(state);
  const rows = usersSelectors.data(state).length;
  return {
    delegate,
    startKey,
    rows,
  };
}

function mapDisptachToProps() {
  return {
    onSelect(selectedSection) {
      console.log(selectedSection);
    },
  };
}

const SettingsLeftPanel = connect(
  mapStateToProps,
  mapDisptachToProps,
)(SelectionList);

export default SettingsLeftPanel;
