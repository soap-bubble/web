import { connect } from 'react-redux';
import { actionCreators } from './ducks';
import BlogPage from './BlogPage';

function mapDispatchToProps(dispatch) {
  return {
    init() {
      return dispatch(actionCreators.fetch())
    },
  };
}

export default connect(
  null,
  mapDispatchToProps,
)(BlogPage);
