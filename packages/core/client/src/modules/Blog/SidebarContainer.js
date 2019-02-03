import { connect } from 'react-redux';
import { selectors } from './ducks';
import Sidebar from './Sidebar';

function mapStateToProps(state) {
  const entries = selectors.blogEntries(state);
  return {
    entries,
  };
}

export default connect(
  mapStateToProps,
)(Sidebar);
