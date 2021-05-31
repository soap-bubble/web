import axios from 'axios'

export function bySceneId(sceneId) {
  return axios.get(`${config.apiHost}/scene`, { params: { id: sceneId } })
}

export default {
  bySceneId,
}
