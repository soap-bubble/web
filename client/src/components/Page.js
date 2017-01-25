import React from 'react';

import Header from '../containers/Header';

const App = ({ children }) => (
  <div>
    <Header />
    { children }
  </div>
);

export default App;
