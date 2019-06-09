// The polyfill will emulate a full ES6 environment (for old browsers)
// (including generators, which means async/await)
// import 'babel-polyfill';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/css/bootstrap-theme.min.css';
// import 'bootstrap-social/bootstrap-social.css';
import '@soapbubble/style/dist';
import { connect } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  Page as Admin,
  Users as AdminUsers,
  Bot as AdminBot,
} from 'app/modules/admin';
import configureStore from './store';
import { login } from './modules/soapbubble';
import '../assets/styles/main.scss';
import Page from './components/Page';
import About from './components/About';
import Examples from './containers/Examples';
import Login from './containers/Login';
import Settings from './containers/Settings';
import { Page as User } from './modules/User';
import { Page as BlogPage, Entries, Entry } from './modules/Blog';
import Privacy from './containers/Privacy';

const { store, firstRoute } = configureStore();

const App = ({ component }) => component();
const ConnectedApp = connect(({ page: { path, component } }) => {
  return {
    component,
  };
})(App);

window.onload = () => {
  function render() {
    ReactDOM.render(
      <Provider store={store}>
        <ConnectedApp />
      </Provider>,
      document.getElementById('root'),
    );
  }
  store.dispatch(login.actions.init());
  store.dispatch(firstRoute()).then(() => render())
};
