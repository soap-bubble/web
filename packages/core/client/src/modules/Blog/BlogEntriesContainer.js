import { connect } from 'react-redux';
import { selectors } from './ducks';
import BlogEntries from './BlogEntries';

function mapStateToProps(state) {
  const entries = selectors.blogEntries(state);
  return {
    entries,
  };
}

export default connect(
  mapStateToProps,
)(BlogEntries);
