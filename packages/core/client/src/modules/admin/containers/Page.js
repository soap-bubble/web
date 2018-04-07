import { connect } from 'react-redux';

import PageComponent from '../components/Page';

function mapStateToProps(state, props) {
  const { router } = props;
  const active = router.params.category;
  return {
    active,
  };
}

const Page = connect(mapStateToProps)(PageComponent);

export default Page;
