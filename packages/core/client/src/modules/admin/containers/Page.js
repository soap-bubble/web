import { connect } from 'react-redux';

import PageComponent from '../components/Page';

function mapStateToProps(state) {
  const { location } = state;
  const active = location.params.category;
  return {
    active,
  };
}

const Page = connect(mapStateToProps)(PageComponent);

export default Page;
