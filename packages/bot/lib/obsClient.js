import OBSWebsocket from 'obs-websocket-js';
import factory, { define } from './factory';

define({
  obsConfig(config) {
    return config.obs;
  },
  obs: async (obsConfig) => {
    console.log('Connecting to OBS');
    const obs = new OBSWebsocket();
    if (obsConfig.enabled) {
      const {
        address,
        password,
      } = obsConfig;
      await obs.connect({ address, password });
      console.log('Connected to OBS');
    }
    return obs;
  },
});

function createApi(obs, obsConfig) {
  const api = {
    async switchProfile(profile) {
      return await obs.send('SetCurrentProfile', {
        'profile-name': profile,
      });
    },
    async switchScene(scene) {
      return await obs.send('SetCurrentScene', {
        'scene-name': scene,
      });
    },
    async startStream() {
      return await obs.send('StartStreaming');
    },
    async stopStream() {
      return await obs.send('StopStreaming');
    },
  };
  return api;
}

export default function init() {
  return factory(createApi);
}
