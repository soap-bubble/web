import React from 'react';
import PropTypes from 'prop-types';
import { Nav, Navbar, NavItem } from 'react-bootstrap';

const NavBar = ({ onInit, page, onPageChange, rightToolbar }) => (
  <Navbar
    ref={(el) => {
      if (el) {
        onInit();
      }
    }}
    collapseOnSelect
    bg="dark"
    variant="dark"
    sticky="top"
  >
    <Navbar.Brand>
      Soap Bubble
    </Navbar.Brand>
    <Navbar.Toggle />
    <Navbar.Collapse>
      <Nav className="mr-auto" onSelect={onPageChange} className="mr-auto">
        <Nav.Link href="/about" eventKey="route/ABOUT" active={page === 'route/ABOUT' ? true : undefined}>About</Nav.Link>
        <Nav.Link href="/examples" eventKey="route/EXAMPLES" active={page === 'route/EXAMPLES' ? true : undefined}>Examples</Nav.Link>
        <Nav.Link href="/blog" eventKey="route/BLOG" active={page === 'route/BLOG' ? true : undefined}>Blog</Nav.Link>
      </Nav>
      <Nav className="justify-content-end">
        {rightToolbar}
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

NavBar.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  onInit: PropTypes.func,
  rightToolbar: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
  ]),
};

NavBar.defaultProps = {
  rightToolbar: '',
  onInit: () => {},
};

export default NavBar;
