import { Login } from '@soapbubble/components';
import { install } from 'utils/createReducer';
import createEpic from 'utils/createEpic';

const login = new Login({
  rootSelector: state => state.login,
});

install('login', login.reducer);
login.epics.forEach(createEpic);

export default login;
