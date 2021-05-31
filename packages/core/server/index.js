import express from 'express'
import bunyan from 'bunyan'
import path from 'path'
import config from 'config'
import proxy from 'http-proxy-middleware'

const { port, name } = config

const logger = bunyan.createLogger({ name })
const app = express()

const indexHtml = (function() {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.CORE_ENVIRONMENT === 'staging'
  ) {
    return 'index-staging.html'
  }
  if (process.env.NODE_ENV === 'production') {
    return 'index-production.html'
  }
  return 'index.html'
})()

app.use(express.static('public'))
app.use('/__', proxy({ target: 'http://localhost:4060' }))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, `../public/${indexHtml}`))
})

app.listen(port, () => {
  logger.info(`server up and running on ${port}`)
})
