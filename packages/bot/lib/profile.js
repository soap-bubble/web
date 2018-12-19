import axios from 'axios';
import retry from 'async-retry';
import qs from 'qs'

export function fetchBotProfile(config) {
  return retry(() => axios.get(`${config.authHost}/GetBotSettings`, {
    params: {
      token: config.get('auth.token', ''),
    },
  })
    .then(({ data }) => {
      return data;
    }));
}

export function saveBotProflie(config) {
  const query = qs.stringify({
    token: config.get('auth.token', ''),
  });
  return (data) => axios.post(`${config.authHost}/SaveBotSettings?${query}`, {
    data,
  });
}
