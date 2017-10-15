import axios from 'axios';

export function fetchInitial() {
  return axios.get(`${config.apiHost}/api/gamestate`);
}

export function lint() {}
