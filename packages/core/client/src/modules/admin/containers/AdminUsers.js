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

function mapDisptachToProps(dispatch) {
  dispatch(usersActions.fetchAllUsers());
  return {
    onSelect(selectedSection) {
      console.log(selectedSection);
    },
    ref(exists) {
      if (exists) {

      }
    },
  };
}

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(SelectionList);
