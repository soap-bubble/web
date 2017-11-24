import { routerReducer as routing } from 'react-router-redux';
import examples from './example';
import page from './page';
import { reducer as user } from '../modules/User';
import { login } from '../modules/soapbubble';

export default {
  examples,
  page,
  routing,
  login: login.reducer,
  user,
};
