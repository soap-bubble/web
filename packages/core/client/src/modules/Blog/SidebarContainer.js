import { connect } from 'react-redux';
import { selectors } from './ducks';
import Sidebar from './Sidebar';

function mapStateToProps(state) {
  const entries = selectors.blogEntries(state);
  return {
    entries,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onEntry(slug) {
      dispatch({
        type: 'route/BLOG_ARTICLE',
        params: {
          slug,
        },
      });
    }
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Sidebar);
