import { connect } from 'react-redux';
import NavBar from '../components/NavBar';
import { changePage } from '../actions';

const mapStateToProps = ({ page, product }) => ({
  page,
  product,
});

const mapDispatchToProps = dispatch => ({
  onPageChange(page) {
    dispatch(changePage(page));
  },
});

const Header = connect(
  mapStateToProps,
  mapDispatchToProps,
)(NavBar);

export default Header;
