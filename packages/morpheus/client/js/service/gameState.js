import axios from 'axios'

export function fetchInitial() {
  return axios.get(`${config.apiHost}/api/gamestates`)
}

export function lint() {}
