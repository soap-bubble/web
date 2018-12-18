import uuid from 'uuid';
import passport from 'passport';


export default function userRoute(app, db, createLogger) {
  const logger = createLogger('routes:bot');

  function initBot() {
    const Bot = db.model('Bot');
    const bot = new Bot({
      letsPlayEnabled: false,
      letsPlayUserId: '',
      letsPlayChannel: '',
      token: '',
    });
    return bot.save();
  }

  function botSettings() {
    return db.model('Bot').findOne().exec().then((bot) => {
      if (!bot) {
        return initBot();
      }
      return bot;
    });
  }

  function botAuthMiddleware(req, res, next) {
    const {
      token,
    } = req.query;

    return botSettings().then((bot) => {
      res.bot = bot;
      if (!token) {
        return passport.authenticate('google-login-token')(req, res, next);
      }
      if (bot.token === token) {
        return next();
      }
      return res.status(401).send('Not authorized');
    });
  }

  app.get('/GetBotSettings', botAuthMiddleware, (req, res) => {
    logger.info({
      route: 'GetBotSettings',
      method: 'GET',
    });

    res.status(200).send(res.bot);
  });

  app.post('/SaveBotSettings', botAuthMiddleware, (req, res) => {
    logger.info({
      route: 'SaveBotSettings',
      method: 'POST',
    });

    botSettings().then(bot => Object.assign(bot, req.body).save()
      .then(() => res.status(200).send(bot))
      .catch(() => res.status(500).send('Failed to save')));
  });
}
