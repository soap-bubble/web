import React from 'react';
import { connect } from 'react-redux';

import Header from './Header';
import About from './About';
import Examples from './Examples';
//import Footer from './Footer';

const pages = {
  about: <About />,
  examples: <Examples />,
};

function mapStateToProps({ page }) {
  const { current } = page;
  return {
    current,
  };
}

function mapDisptachToProps(dispatch) {
  return {};
}

const Contents = ({
  current,
}) => {
  return (
    <div>
      <Header />
      {pages[current]}
    </div>
  );
};

export default connect(
  mapStateToProps,
  mapDisptachToProps
)(Contents);
