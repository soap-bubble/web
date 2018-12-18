import axios from 'axios';
import qs from 'qs';
import retry from 'async-retry';
import factory, { define } from './factory';

define({
  twitchClientId(config) {
    return config.get('twitch.clientID');
  },
  twitchClientSecret(config) {
    return config.get('twitch.clientSecret');
  },
  promiseTwitchUserToken(logger, profile, saveProfile, twitchClientId, twitchClientSecret) {
    let {
      twitchTokenAccess,
      twitchTokenRefresh,
      twitchTokenExpiresIn,
    } = profile;

    let isExpired;
    let isExpiredTimeoutId;
    async function refresh() {
      logger.info('Refreshing token');
      const query = qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: twitchTokenRefresh,
        client_id: twitchClientId,
        client_secret: twitchClientSecret,
      });
      try {
        return await retry(async () => await axios.post(`https://id.twitch.tv/oauth2/token?${query}`), {
          retries: 1,
        });
      } catch (err) {
        logger.error('Failed to refresh twitch token', err);
        return {
          access_token: null,
          refresh_token: null,
        };
      }
    }

    function expire() {
      logger.info('Force expire token');
      if (isExpiredTimeoutId) {
        clearTimeout(isExpiredTimeoutId);
      }
      isExpired = true;
    }

    async function promiseTwitchUserToken() {
      if (typeof isExpired === 'undefined') {
        try {
          logger.info('Getting token status');
          const response = await axios.get('https://api.twitch.tv/kraken', {
            headers: {
              Authorization: oauth(twitchTokenAccess),
              Accept: 'application/vnd.twitchtv.v5+json',
              'Client-ID': twitchClientId,
            }
          });
          const  { data: { valid } } = response;
          isExpired = !valid;
        } catch (e) {
          isExpired = true;
          console.error('Failed to get token status', e);
        }
      }
      if (isExpired) {
        logger.info('Token is expired... refreshing');
        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        } = await refresh();
        if (newAccessToken && newRefreshToken) {
          twitchTokenAccess = newAccessToken;
          twitchTokenRefresh = newRefreshToken;
        }
        logger.info('Update token on auth server');
        await saveProfile({
          twitchTokenAccess,
          twitchTokenRefresh,
        });
        if (isExpiredTimeoutId) {
          clearTimeout(isExpiredTimeoutId);
        }
        isExpiredTimeoutId = setTimeout(function twitchTokenExpires() {
          logger.info('Token is expired because of timeout');
          isExpired = true;
          isExpiredTimeoutId = null;
        }, twitchTokenExpiresIn * 1000);
        isExpired = false;
      }

      return twitchTokenAccess;
    };

    promiseTwitchUserToken.expire = expire;

    return promiseTwitchUserToken;
  },
})

function twitchApiV5(path) {
  return `https://api.twitch.tv/kraken/${path}`;
}

function oauth(token) {
  return `OAuth ${token}`
}

function createApi(twitchClientId, logger, promiseTwitchUserToken) {
  async function promiseAuthorizatedHeaders() {
    return {
      'Client-ID': twitchClientId,
      'Authorization': oauth(await promiseTwitchUserToken()),
      Accept: 'application/vnd.twitchtv.v5+json',
    };
  }

  async function attemptWithRefreh(func) {
    let authorized;
    let count = 0;
    do {
      try {
        logger.info('attemptWithRefreh DO...WHILE start');
        const result = await func();
        authorized = true;
        logger.info('attemptWithRefreh DO...WHILE done')
        return result;
      } catch (err) {
        logger.info('attemptWithRefreh DO...WHILE err')
        if (err.response && err.response.status === 401 && err.response.data && err.response.data.message === 'invalid oauth token') {
          promiseTwitchUserToken.expire();
        } else {
          logger.warn('Not a token error', err);
          throw err;
        }
      }
      count++;
    } while (!authorized && count <= 3);
  }

  const api = {
    async getChannel() {
      try {
        logger.info('getChannel');
        const { data } = await attemptWithRefreh(async () => await axios.get(twitchApiV5('channel'), {
          headers: await promiseAuthorizatedHeaders(),
        }));
        return data;
      } catch(err) {
        const message = 'Failed to get channel from twitch';
        logger.error(message, err);
        return {
          error: message,
        };
      }
    },
    async setChannel(info) {
      try {
        logger.info('setChannel');
        const { _id: channel } = await api.getChannel();
        const { data } = await attemptWithRefreh(async () => await axios.put(twitchApiV5(`channels/${channel}`), {
          channel: info,
        }, {
          headers: await promiseAuthorizatedHeaders(),
        }));
        return data;
      } catch(err) {
        const message = 'Failed to set channel';
        logger.error(message, err);
        return {
          error: message,
        };
      }
    }
  }
  return api;
}

export default function init() {
  const api = factory(createApi);

  return api;
}
