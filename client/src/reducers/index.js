import { routerReducer as routing } from 'react-router-redux';
import examples from './example';
import page from './page';
import { reducer as login } from '../modules/Login';
import { reducer as user } from '../modules/User';

export default {
  examples,
  page,
  routing,
  login,
  user,
};
