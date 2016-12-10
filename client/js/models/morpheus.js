import axios from 'axios';
import wagner from 'wagner-core';

export function bySceneId(sceneId) {
  return axios.get(`/api/scene/${sceneId}`);
}

export const scene = {
  bySceneId
};

wagner.constant('scene', scene);
