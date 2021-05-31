export default function(app) {
  app.get('/bot/ping', (req, res) => res.send('ok'))
}
