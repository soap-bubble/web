import { connect } from 'react-redux';
import { actionCreators } from './ducks';
import BlogPage from './BlogPage';

function mapStateToProps(state) {
  const { location: { params: { slug } } } = state;
  return {
    slug,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    init() {
      return dispatch(actionCreators.fetch())
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BlogPage);
