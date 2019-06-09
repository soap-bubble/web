import React from 'react';

import Header from '../containers/Header';
import Footer from '../containers/FooterContainer';

const App = ({ children }) => (
  <div>
    <Header />
    <div className="content">
      { children }
    </div>
    <Footer />
  </div>
);

export default App;
