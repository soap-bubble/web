import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <Link to="/privacy">
        Privacy Policy
      </Link>
    </div>
  </footer>
);

Footer.propTypes = {
};

Footer.defaultProps = {
};

export default Footer;
