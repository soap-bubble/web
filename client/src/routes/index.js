import React from 'react';
import { Router, Route, IndexRedirect } from 'react-router';
import { browserHistory, createMemoryHistory } from 'react-router';
import history from './history';

import Page from '../components/Page';
import About from '../components/About';
import Examples from '../containers/Examples';
import Login from '../containers/Login';
import Settings from '../containers/Settings';
import Privacy from '../containers/Privacy';

const routes = (
  <Router history={history}>
    <Route path="/" component={Page}>
      <IndexRedirect to="/examples" />
      <Route path="about" component={About} />
      <Route path="examples" component={Examples} />
      <Route path="login" component={Login} />
      <Route path="settings" component={Settings} />
      <Route path="privacy" component={Privacy} />
    </Route>
  </Router>
);

export default routes;
