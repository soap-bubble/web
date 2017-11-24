import axios from 'axios';
import { Login } from '@soapbubble/components';
import config from '../../config';
import createEpic from '../../utils/createEpic';

const login = new Login({
  rootSelector: state => state.login,
  googleConfigProvider: () => axios.get(`${config.authServer}/google/oauth`).then(res => res.data),
});

login.epics.forEach(createEpic);

export default login;
