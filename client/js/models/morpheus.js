import axios from 'axios';
import wagner from 'wagner-core';

export const scene = {
  bySceneId(sceneId) {
    return axios.get(`/api/scene/${sceneId}`);
  }
}

wagner.constant('scene', scene);