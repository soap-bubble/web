import cors from 'cors'
import config from 'config'

export default function(app) {
  // app.use((req, res, next) => {
  //   console.log(req.path)
  //   next()
  // })
  // app.use(cors(config.cors))
  app.get('/bot/ping', (req, res) => res.send('ok'))
}
