import { connect } from 'react-redux';
import { SelectionList } from '@soapbubble/components';
import { selectors as usersSelectors, actions as usersActions } from 'app/modules/users';

function mapStateToProps(state) {
  const delegate = usersSelectors.userListDelegate(state);
  const rows = usersSelectors.data(state).length;
  return {
    delegate,
    rows,
  };
}

function mapDispatchToProps(dispatch) {
  dispatch(usersActions.fetchAllUsers());
  return {
    onSelect(selectedSection) {
      console.log(selectedSection);
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SelectionList);
