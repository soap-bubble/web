import React from 'react';

import Header from '../containers/Header';
import Footer from '../components/Footer';

const App = ({ children }) => (
  <div>
    <Header />
    { children }
    <Footer />
  </div>
);

export default App;
