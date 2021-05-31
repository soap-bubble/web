export default function(app, logger) {
  logger.info('Creating ping route')
  app.get('/bot/ping', (req, res) => {
    logger.info('Responding to ping')
    res.send('ok')
  })
}
