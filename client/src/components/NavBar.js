import React from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const NavBar = ({ page, onPageChange }) => (
  <Navbar inverse collapseOnSelect>
    <Navbar.Header>
      <Navbar.Brand>
        <a href="/about">Soapbubble</a>
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav onSelect={onPageChange}>
        {page.available.map(({ label, route }) => (
          <LinkContainer to={`/${route}`}>
            <NavItem active={page.current.route === route} key={`page:${route}`} eventKey={route}>{label}</NavItem>
          </LinkContainer>
        ))}
      </Nav>
    </Navbar.Collapse>
  </Navbar>
);

export default NavBar;
