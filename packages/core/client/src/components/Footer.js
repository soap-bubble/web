import React from 'react';
import { Nav } from 'react-bootstrap';
import PropTypes from 'prop-types';

const Footer = ({
  toPrivacy,
}) => (
  <footer className="footer position-sticky fixed-bottom">
    <Nav className="container" as="ul">
      <Nav.Item as="li">
        <Nav.Link href="/privacy" onClick={toPrivacy}>Privacy Policy</Nav.Link>
      </Nav.Item>
    </Nav>
  </footer>
);

Footer.propTypes = {
};

Footer.defaultProps = {
};

export default Footer;
