import { connect } from 'react-redux';

import PageComponent from '../components/Page';

function mapStateToProps(state, props) {

}

const Page = connect(mapStateToProps)(PageComponent);

export default Page;
