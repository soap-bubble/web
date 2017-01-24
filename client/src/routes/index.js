import React from 'react';
import { Route, IndexRoute } from 'react-router';

import Contents from '../views/Contents';

const routes = (
  <Route path="/">
    <IndexRoute component={Contents} />\
  </Route>
);

export default routes;
