import path from 'path'
import express from 'express'
import bunyan from 'bunyan'
import config from 'config'
import proxy from 'http-proxy-middleware'
import socket from './socket'

import { get as getModel } from './db/install'
import db, { prime, update } from './db'

const logger = bunyan.createLogger({ name: 'webgl-pano-server' })
const app = express()

app.set('view engine', 'ejs')
app.set('views', path.resolve(__dirname, '../client/html'))

const server = socket(app)

const indexHtml = (function() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.MORPHEUS_ENVIRONMENT === 'staging'
  ) {
    return 'index-staging.html'
  }
  if (process.env.NODE_ENV === 'production') {
    return 'index-production.html'
  }
  return 'index.html'
})()

const gameDbPath = path.resolve(config.gameDbPath)
logger.info('static game dir', { gameDbPath })
const rootPath = config.rootPath ? config.rootPath : ''
app.use('/__', proxy({ target: 'http://localhost:4040' }))
app.use(
  '/api',
  proxy({
    target: 'http://localhost:4041/soapbubble/us-central1',
    pathRewrite: function(path) {
      return path.replace('/api', '')
    },
  }),
)
app.use(`${rootPath}/GameDB`, express.static(gameDbPath))
app.get(`${rootPath}/($|index.html)`, (req, res) => {
  res.sendFile(path.join(__dirname, `../public/${indexHtml}`))
})
app.use(rootPath, express.static('public'))

server.listen(config.port, () => {
  logger.info('server up and running on 8050')
})
