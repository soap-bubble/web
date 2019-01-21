import axios from 'axios';
import qs from 'qs';

export default function (app, db, config, createLogger) {
  const logger = createLogger('routes:twitch');
  const { scope, state, clientID, clientSecret, callbackURL } = config.passport.strategies.twitch;

  const Bot = db.model('Bot');
  app.get(
    '/twitch/callback',
    (req, res) => {
      const { code } = req.query;
      const query = qs.stringify({
        client_id: clientID,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackURL,
      });
      logger.info('Request oauth token', query);
      axios.post(`https://id.twitch.tv/oauth2/token?${query}`).then(async (response) => {
        const { status, data } = response;
        if (status === 200) {
          logger.info('Oauth token success');
          const profileResponse = await axios.get('https://api.twitch.tv/kraken', {
            headers: {
              Authorization: `OAuth ${data.access_token}`,
              Accept: 'application/vnd.twitchtv.v5+json',
            }
          });
          const { data: { token: { user_name: twitchBotName } } } = profileResponse;
          let bot = await Bot.findOne();
          if (!bot) {
            bot = new Bot();
          }
          Object.assign(bot, {
            twitchTokenAccess: data.access_token,
            twitchTokenRefresh: data.refresh_token,
            twitchTokenExpiresIn: data.expires_in,
            twitchBotName,
          });

          await bot.save();
          res.redirect('http://localhost:8060/admin/bot');
        }
      }, e => {
        res.status(e.response.status).send(e.response.data)
      });
    }
  );
}