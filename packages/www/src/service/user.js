import axios from 'axios';

export function getAllSaves({ token }) {
  return axios.get(`${config.authHost}/GetAllSaveMeta`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function newSaveGame({
  gamestates,
  currentSceneId,
  previousSceneId,
  token,
}) {
  return axios.post(`${config.authHost}/NewSaveGame`, {
    gamestates,
    currentSceneId,
    previousSceneId,
    scenestate: {},
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function saveGame({
  token,
  gamestates,
  currentSceneId,
  previousSceneId,
  saveId,
 }) {
  return axios.post(`${config.authHost}/SaveGame`, {
    gamestates,
    currentSceneId,
    previousSceneId,
    saveId,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getSaveGame({ saveId, token }) {
  return axios.post(`${config.authHost}/GetSaveGame`, {
    saveId,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
