import React from 'react';
import { Router, Route, IndexRedirect } from 'react-router';
import { browserHistory, createMemoryHistory } from 'react-router';

import { Page as Admin } from 'app/modules/admin';
import Page from '../components/Page';
import About from '../components/About';
import Examples from '../containers/Examples';
import Login from '../containers/Login';
import Settings from '../containers/Settings';
import { Page as User } from '../modules/User';
import Privacy from '../containers/Privacy';
import history from './history';

const routes = (
  <Router history={history}>
    <Route path="/" component={Page}>
      <IndexRedirect to="/examples" />
      <Route path="about" component={About} />
      <Route path="examples" component={Examples} />
      <Route path="login" component={Login} />
      <Route path="settings" component={Settings} />
      <Route path="user/:category" component={User} />
      <Route path="admin" component={Admin} />
      <Route path="privacy" component={Privacy} />
    </Route>
  </Router>
);

export default routes;
