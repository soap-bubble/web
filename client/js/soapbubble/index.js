import { Login } from '@soapbubble/components';
import { install } from 'utils/createReducer';

const login = new Login({
  rootSelector: state => state.login,
});

install('login', login.reducer);

export { login };
