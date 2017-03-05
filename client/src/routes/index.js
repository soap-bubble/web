import React from 'react';
import { Router, Route, IndexRedirect } from 'react-router';
import { browserHistory, createMemoryHistory } from 'react-router';
import history from './history';

import Page from '../components/Page';
import About from '../components/About';
import Examples from '../containers/Examples';

const routes = (
  <Router history={ history }>
    <Route path="/" component={Page}>
      <IndexRedirect to="/examples" />
      <Route path="about" component={About} />
      <Route path="examples" component={Examples} />
    </Route>
  </Router>
);

export default routes;
