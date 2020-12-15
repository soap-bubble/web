import OBSWebsocket from 'obs-websocket-js'
import factory, { define } from './factory.js'
import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'bot-obs' })

define({
  obsConfig(config) {
    return config.obs
  },
  obs: async obsConfig => {
    logger.info('Connecting to OBS')
    const obs = new OBSWebsocket()
    if (obsConfig.enabled) {
      const { address, password } = obsConfig
      await obs.connect({ address, password })
      logger.info('Connected to OBS')
    }
    return obs
  },
})

function createApi(obs) {
  const api = {
    async switchProfile(profile) {
      return await obs.send('SetCurrentProfile', {
        'profile-name': profile,
      })
    },
    async switchScene(scene) {
      return await obs.send('SetCurrentScene', {
        'scene-name': scene,
      })
    },
    async startStream() {
      return await obs.send('StartStreaming')
    },
    async stopStream() {
      return await obs.send('StopStreaming')
    },
  }
  return api
}

export default function init() {
  return factory(createApi)
}
