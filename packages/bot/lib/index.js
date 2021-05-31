import config from 'config'
import bunyan from 'bunyan'

import factory, { init, define } from './factory.js'

import clientFactory from './client.js'
import appFactory from './app.js'
import { definition as socketDefinition } from './socket.js'
import { definition as twitchDefinition } from './twitch/definition.js'
import obsClientFactory from './obsClient.js'
import storageFactory from './storage.js'
import routes from './routes.js'
import googleServiceKey from './googleServiceKey'
import { Firestore } from '@google-cloud/firestore'

define({
  app: appFactory,
  morpheus: clientFactory,
  config: () => config,
  logger: () => bunyan.createLogger({ name: 'morpheus-bot' }),
  ...twitchDefinition,
  ...socketDefinition,
  obsClient: obsClientFactory,
  bucketName: () => 'soapbubble-dev.appspot.com',
  storage: storageFactory,
  routes,
  googleServiceKey: () => googleServiceKey,
  db: googleServiceKey => new Firestore(googleServiceKey),
})

init()

factory(function init(socket, logger, twitchChat, routes) {
  socket.server.listen(config.port, () => {
    logger.info(`App listening on port ${config.port}`)
  })
})
