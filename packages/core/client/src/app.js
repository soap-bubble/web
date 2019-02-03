// The polyfill will emulate a full ES6 environment (for old browsers)
// (including generators, which means async/await)
// import 'babel-polyfill';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/css/bootstrap-theme.min.css';
// import 'bootstrap-social/bootstrap-social.css';
import '@soapbubble/style/dist';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import {
  Page as Admin,
  Users as AdminUsers,
  Bot as AdminBot,
} from 'app/modules/admin';
import store from './store';
import { login } from './modules/soapbubble';
import '../assets/styles/main.scss';
import '../assets/styles/main.less';
import history from './routes/history';
import Page from './components/Page';
import About from './components/About';
import Examples from './containers/Examples';
import Login from './containers/Login';
import Settings from './containers/Settings';
import { Page as User } from './modules/User';
import Privacy from './containers/Privacy';

syncHistoryWithStore(browserHistory, store).listen(({ pathname }) => {
  if (window && window.ga) {
    const { ga } = window;
    ga('set', 'page', pathname);
    ga('send', 'pageview');
  }
});

store.dispatch(login.actions.init());

window.onload = () => {
  render(
    <Provider store={store}>
      <Router history={history}>
        <Route path="/" component={Page}>
          <IndexRedirect to="/examples" />
          <Route path="about" component={About} />
          <Route path="examples" component={Examples} />
          <Route path="login" component={Login} />
          <Route path="settings" component={Settings} />
          <Route path="user/:category" component={User} />
          <Route path="privacy" component={Privacy} />
          <Route path="admin" component={Admin}>
            <Route path="users" component={AdminUsers} />
            <Route path="bot" component={AdminBot} />
          </Route>
        </Route>
      </Router>
    </Provider>,
    document.getElementById('root'),
  );
};
