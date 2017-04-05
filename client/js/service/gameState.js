import axios from 'axios';

export function fetchInitial() {
  return axios.get('/api/gamestate');
}

export function lint() {}
