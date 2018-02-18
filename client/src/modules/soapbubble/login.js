import axios from 'axios';
import { Login } from '@soapbubble/components';
import createEpic from 'app/utils/createEpic';

const login = new Login({
  rootSelector: state => state.login,
  googleConfigProvider: () => axios.get(`${config.authHost}/google/oauth`).then(res => res.data),
});

login.epics.forEach(createEpic);

export default login;
