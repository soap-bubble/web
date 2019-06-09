import { connect } from 'react-redux';

import Footer from '../components/Footer';

function mapDispatchToProps(dispatch) {
  return {
    toPrivacy(e) {
      e.preventDefault();
      dispatch({
        type: 'route/PRIVACY',
      });
    },
  };
}

export default connect(null, mapDispatchToProps)(Footer);
