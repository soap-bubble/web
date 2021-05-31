export default function(app, logger) {
  logger.info('Creating ping route')
  app.get('/bot/ping', (req, res) => res.send('ok'))
}
