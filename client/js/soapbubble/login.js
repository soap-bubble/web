import { Observable } from 'rxjs';
import axios from 'axios';
import { Login } from '@soapbubble/components';
import { install } from 'utils/createReducer';
import createEpic from 'utils/createEpic';

const login = new Login({
  rootSelector: state => state.login,
  googleConfigProvider: () => axios.get(`${config.authHost}/google/oauth`).then(res => res.data),
});

install('login', login.reducer);
login.epics.forEach(createEpic);

export default login;
