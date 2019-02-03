import { connect } from 'react-redux';
import { selectors } from './ducks';
import BlogEntry from './BlogEntry';

function mapStateToProps(state) {
  const entries = selectors.blogEntries(state);
  const assets = selectors.blogAssets(state);
  return {
    assets,
    entries,
  };
}

export default connect(
  mapStateToProps,
)(BlogEntry);
