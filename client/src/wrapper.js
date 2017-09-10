import React from 'react';
import { Provider } from 'react-redux';

const Wrapper = ({ store, children }) => (
  <Provider store={store}>
    { children }
  </Provider>
);

Wrapper.propTypes = {
  store: React.PropTypes.object.isRequired,
};

export default Wrapper;
