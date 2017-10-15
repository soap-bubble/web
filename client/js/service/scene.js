import axios from 'axios';

export function bySceneId(sceneId) {
  return axios.get(`${config.apiHost}/api/scene/${sceneId}`);
}

export default {
  bySceneId,
};
