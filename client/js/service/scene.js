import axios from 'axios';

export function bySceneId(sceneId) {
  return axios.get(`/api/scene/${sceneId}`);
}

export const scene = {
  bySceneId
};
