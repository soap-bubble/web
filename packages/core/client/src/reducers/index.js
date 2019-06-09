import { reducer as user } from 'app/modules/User';
import { login } from 'app/modules/soapbubble';
import { reducer as admin } from 'app/modules/admin';
import { reducer as users } from 'app/modules/users';
import { reducer as blog } from 'app/modules/Blog';
import examples from './example';
import page from './page';

export default {
  examples,
  page,
  login: login.reducer,
  user,
  admin,
  users,
  blog,
};
