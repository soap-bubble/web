import React from 'react';
import { connect } from 'react-redux';
import cn from 'classnames';
import { changePage } from '../actions';

function mapStateToProps({ page }) {
  const {
    current: activePage,
    navItems,
  } = page;
  return {
    activePage,
    navItems,
  };
}

function mapDisptachToProps(dispatch) {
  return {
    onPageChange(pageName) {
      dispatch(changePage(pageName));
    },
  };
}

const styles = {
  root: cn('navbar', 'navbar-default'),
  navBarContainer: cn('container-fluid'),
  navBarHeader: cn('navbar-header'),
  menu: cn('collapse', 'navbar-collapse'),
  navItem: cn('nav-item'),
  menuList: cn('nav', 'navbar-nav'),
  collaspedMenuButton: cn('navbar-toggle', 'collapsed'),
  brand: cn('navbar-brand')
};

const Header = ({
  activePage,
  navItems,
  onPageChange,
}) => (
  <nav className={styles.root}>
    <div className={styles.navBarContainer}>
      {/* Brand and toggle get grouped for better mobile display */}
      <div className={styles.navBarHeader}>
        <button type="button" className={styles.collaspedMenuButton} data-toggle="collapse" data-target="#soapbubble-navbar-collapse" aria-expanded="false">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
        <a className={styles.brand} href="#">Soap Bubble</a>
      </div>

      {/* Collect the nav links, forms, and other content for toggling */}
      <div className={styles.menu} id="soapbubble-navbar-collapse">
        <ul className={styles.menuList}>
          {navItems.map(({ name, label }) => {
            const isActive = activePage === name;
            return (
              <li key={name} onClick={onPageChange.bind(null, name)} className={cn({
                activePage: isActive,
                [styles.navItem]: true
              })}>
                <a href="#">{label}
                  {isActive && (<span className="sr-only">(current)</span>)}
                </a>
              </li>
            );
          })}
        </ul>
      </div> {/* /.navbar-collapse */}
    </div> {/* /.container-fluid */}
  </nav>
)

export default connect(
  mapStateToProps,
  mapDisptachToProps,
)(Header);
