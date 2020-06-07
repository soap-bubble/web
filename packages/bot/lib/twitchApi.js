import axios from 'axios'
import bodyParser from 'body-parser'
import qs from 'qs'
import retry from 'async-retry'
import Promise from 'bluebird'
import factory, { define } from './factory'

define({
  twitchClientId(config) {
    return config.get('twitch.clientID')
  },
  twitchClientSecret(config) {
    return config.get('twitch.clientSecret')
  },
  twitchWebhookEndpoint(config) {
    return config.get('twitch.webhook')
  },
  twitchSecret(config) {
    return config.get('twitch.secret')
  },
  async twitchLogin(profileProvider) {
    return (await profileProvider()).twitchUserName
  },
  profileId(config) {
    return config.get('profileId')
  },
  twitchHooks(app, logger) {
    const topics = []
    logger.info('Creating webhook callback')
    app.get('/twitch/hook/:topic', (req, res) => {
      logger.info('get hook')
      const { topic: reqTopic } = req.params
      const foundTopic = topics.find(({ topic: t }) => reqTopic === t)

      if (!foundTopic) {
        logger.warn(`Twitch webhook rejected for ${reqTopic}`, req.body)
        return res.status(404).send('not found')
      }

      try {
        const {
          query: { 'hub.challenge': challenge },
        } = req
        if (challenge) {
          logger.info('Responding with challenge', challenge)
          return res.status(200).send(challenge)
        }

        return res.status(401).send('not authorized')
      } catch (e) {
        return res.status(500).send('error')
      }
    })

    app.post('/twitch/hook/:topic', bodyParser.json(), (req, res) => {
      logger.info('post hook')
      const { topic: reqTopic } = req.params
      const foundTopic = topics.find(({ topic: t }) => reqTopic === t)

      if (!foundTopic) {
        logger.warn(`Twitch webhook rejected for ${reqTopic}`, req.body)
        return res.status(404).send('not found')
      }

      const { topic, listener } = foundTopic
      logger.info(`Twitch webhook received for ${topic}`, req.body)
      listener(req.body)
      return res.status(200).send('OK')
    })

    const hooks = {
      listen(topic, listener) {
        logger.info(`Listening to ${topic} via webhook`)

        topics.push({
          topic,
          listener,
        })
      },
    }

    process.on('SIGTERM', async () => {
      const api = factory(createApi)
      await api.unsubscribe(topics)
      process.exit()
    })

    return hooks
  },
  provideTwitchUserToken(
    logger,
    profileProvider,
    saveProfile,
    twitchClientId,
    twitchClientSecret
  ) {
    let twitchTokenAccess
    let twitchTokenRefresh
    let twitchTokenExpiresIn

    logger.info({
      twitchTokenAccess,
      twitchTokenRefresh,
      twitchTokenExpiresIn,
    })
    let isExpired
    let isExpiredTimeoutId
    async function refresh() {
      logger.info('Refreshing token')
      const query = qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: twitchTokenRefresh,
        client_id: twitchClientId,
        client_secret: twitchClientSecret,
      })
      try {
        return await retry(
          async () =>
            await axios.post(`https://id.twitch.tv/oauth2/token?${query}`),
          {
            retries: 1,
          }
        )
      } catch (err) {
        logger.error('Failed to refresh twitch token', err)
        return {
          access_token: null,
          refresh_token: null,
        }
      }
    }

    function expire() {
      logger.info('Force expire token')
      if (isExpiredTimeoutId) {
        clearTimeout(isExpiredTimeoutId)
      }
      isExpired = true
    }

    function reset() {
      expire()
      twitchTokenAccess = null
      twitchTokenRefresh = null
      twitchTokenExpiresIn = null
    }

    async function tokenStatus() {
      logger.info('Getting token status')
      const response = await axios.get('https://api.twitch.tv/kraken', {
        headers: {
          Authorization: oauth(twitchTokenAccess),
          Accept: 'application/vnd.twitchtv.v5+json',
          'Client-ID': twitchClientId,
        },
      })
      return response
    }

    function setExpireTimeout() {
      isExpiredTimeoutId = setTimeout(function twitchTokenExpires() {
        logger.info('Token is expired because of timeout')
        isExpired = true
        isExpiredTimeoutId = null
      }, Math.max(0, twitchTokenExpiresIn * 1000 - 60000))
    }

    async function provideTwitchUserToken() {
      logger.info('provideTwitchUserToken')
      if (!twitchTokenAccess) {
        const profile = await profileProvider()
        twitchTokenAccess = profile.twitchTokenAccess
        twitchTokenRefresh = profile.twitchTokenRefresh
        twitchTokenExpiresIn = profile.twitchTokenExpiresIn
      }
      if (typeof isExpired === 'undefined') {
        try {
          const {
            data: { valid },
          } = await tokenStatus()
          isExpired = !valid
          if (valid) {
            setExpireTimeout()
          }
        } catch (e) {
          isExpired = true
          logger.error('Failed to get token status', e)
        }
      }
      if (isExpired) {
        logger.info('Token is expired... refreshing', isExpired)
        const {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        } = await refresh()
        if (newAccessToken && newRefreshToken) {
          twitchTokenAccess = newAccessToken
          twitchTokenRefresh = newRefreshToken
          logger.info('Update token on auth server')
          await saveProfile({
            twitchTokenAccess,
            twitchTokenRefresh,
          })
        }
        if (isExpiredTimeoutId) {
          clearTimeout(isExpiredTimeoutId)
        }
        setExpireTimeout()
        isExpired = false
      }

      return twitchTokenAccess
    }

    provideTwitchUserToken.expire = expire
    provideTwitchUserToken.reset = reset

    return provideTwitchUserToken
  },
})

function twitchApiV5(path) {
  return `https://api.twitch.tv/kraken/${path}`
}

function twitchApiNew(path) {
  return `https://api.twitch.tv/helix/${path}`
}

function oauth(token) {
  return `OAuth ${token}`
}

function bearer(token) {
  return `Bearer ${token}`
}

function createApi(
  twitchClientId,
  twitchWebhookEndpoint,
  twitchSecret,
  twitchLogin,
  logger,
  provideTwitchUserToken,
  twitchHooks
) {
  async function promiseV5AuthorizatedHeaders() {
    return {
      'Client-ID': twitchClientId,
      Authorization: oauth(await provideTwitchUserToken()),
      Accept: 'application/vnd.twitchtv.v5+json',
      // Accept: 'application/json; charset=utf-8',
    }
  }

  async function promiseNewAuthorizatedHeaders() {
    return {
      'Client-ID': twitchClientId,
      Authorization: bearer(await provideTwitchUserToken()),
      // Accept: 'application/json; charset=utf-8',
    }
  }

  function clientHeaders() {
    return {
      'Client-ID': twitchClientId,
    }
  }

  async function attemptWithRefreh(func) {
    let authorized
    let count = 0
    do {
      try {
        logger.info('attemptWithRefreh DO...WHILE start')
        const result = await func()
        authorized = true
        logger.info('attemptWithRefreh DO...WHILE done')
        return result
      } catch (err) {
        logger.info('attemptWithRefreh DO...WHILE err')
        if (
          err.response &&
          err.response.status === 401 &&
          err.response.data &&
          err.response.data.message === 'invalid oauth token'
        ) {
          provideTwitchUserToken.reset()
        } else {
          logger.warn('Not a token error', err.response && err.response.data)
          throw err
        }
      }
      count++
    } while (!authorized && count <= 3)
  }
  // https://api.twitch.tv/helix/users/follows?first=1&to_id=
  const api = {
    async listenForFollow() {
      const userId = await api.getMyUserId()
      const topic = twitchApiNew(`users/follows?first=1&to_id=${userId}`)
      logger.info(`listenForFollow:${topic}`)
      twitchHooks.listen('follow', response => logger.info(topic, response))
      await api.subscribe('follow', topic)
    },
    async listenForStreamChanges() {
      const userId = await api.getMyUserId()
      const topic = twitchApiNew(`streams?user_id=${userId}`)
      logger.info(`listenForStreamChanges:${topic}`)
      twitchHooks.listen('stream', response => logger.info(topic, response))
      await api.subscribe('stream', topic)
    },
    async listenForUserChanges() {
      const userId = await api.getMyUserId()
      const topic = twitchApiNew(`users?id=${userId}`)
      logger.info(`listenForUserChanges:${topic}`)
      twitchHooks.listen('user', response => logger.info(topic, response))
      await api.subscribe('user', topic)
    },
    async subscribe(topicName, topicUrl) {
      const callback = `${twitchWebhookEndpoint}/${topicName}`
      logger.info(`subscribeStreamChanges:${callback}`)
      try {
        const { status, data } = await attemptWithRefreh(
          async () =>
            await axios.post(
              twitchApiNew('webhooks/hub'),
              {
                'hub.callback': callback,
                'hub.mode': 'subscribe',
                'hub.topic': topicUrl,
                'hub.lease_seconds': 120,
              },
              {
                headers: await promiseNewAuthorizatedHeaders(),
              }
            )
        )
        logger.info('subscribeStreamChanges response', status, data)
        return data
      } catch (err) {
        const message = `Failed to subscribe to twitch topic: ${topicUrl}`
        logger.error(message)
        return {
          error: message,
        }
      }
    },
    async unsubscribe(topics) {
      await Promise.all(
        topics.map(async topic => {
          logger.info(`unsubscribe ${topic}`)
          const { data } = await attemptWithRefreh(
            async () =>
              await axios.post(
                twitchApiNew('webhooks/hub'),
                {
                  hub: {
                    callback: `${twitchWebhookEndpoint}/${topic}`,
                    mode: 'unsubscribe',
                    topic,
                  },
                },
                {
                  headers: await promiseNewAuthorizatedHeaders(),
                }
              )
          )
        })
      )
    },
    async getMyStream() {
      try {
        logger.info('getMyStream')
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.get(twitchApiNew('streams'), {
              headers: await promiseNewAuthorizatedHeaders(),
              params: {
                user_login: twitchLogin,
              },
            })
        )
        return data.data[0]
      } catch (err) {
        const message = 'Failed to get streams from twitch'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async getMyUserId() {
      try {
        logger.info('getMyUserId')
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.get(twitchApiNew('users'), {
              headers: await promiseNewAuthorizatedHeaders(),
              params: {
                login: twitchLogin,
              },
            })
        )
        return data.data[0].id
      } catch (err) {
        const message = 'Failed to get user from twitch'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async getEmojis() {
      try {
        logger.info('getEmojis')
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.get(twitchApiV5('chat/emoticons'), {
              headers: {
                ...clientHeaders(),
                Accept: 'application/vnd.twitchtv.v5+json',
              },
            })
        )
        return data
      } catch (err) {
        const message = 'Failed to get tags from twitch'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async getTags(userId) {
      try {
        logger.info('getTags')
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.get(twitchApiNew('streams/tags'), {
              headers: await promiseNewAuthorizatedHeaders(),
              params: {
                broadcaster_id: userId,
              },
            })
        )
        return data.data
      } catch (err) {
        const message = 'Failed to get tags from twitch'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async setTags(userId, tags) {
      try {
        logger.info('setTags')
        await attemptWithRefreh(
          async () =>
            await axios.put(
              twitchApiNew(`streams/tags?broadcaster_id=${userId}`),
              {
                tag_ids: tags,
              },
              {
                headers: await promiseNewAuthorizatedHeaders(),
              }
            )
        )
      } catch (err) {
        const message = 'Failed to set tags'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async getChannel() {
      try {
        logger.info('getChannel')
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.get(twitchApiV5('channel'), {
              headers: await promiseV5AuthorizatedHeaders(),
            })
        )
        return data
      } catch (err) {
        const message = 'Failed to get channel from twitch'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async setChannel(info) {
      try {
        logger.info('setChannel')
        const { _id: channel } = await api.getChannel()
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.put(
              twitchApiV5(`channels/${channel}`),
              {
                first: info,
              },
              {
                headers: await promiseV5AuthorizatedHeaders(),
              }
            )
        )
        return data
      } catch (err) {
        const message = 'Failed to set channel'
        logger.error(message, err)
        return {
          error: message,
        }
      }
    },
    async findAllStreamTags(findTags) {
      const tags = []

      try {
        logger.info('getAllStreamTags')
        let pagination
        let differs
        do {
          const {
            data: { data, pagination: nextPage },
          } = await attemptWithRefreh(
            async () =>
              await axios.get(twitchApiNew(`tags/streams`), {
                headers: await promiseNewAuthorizatedHeaders(),
                params: {
                  first: 100,
                  ...(pagination
                    ? {
                        after: pagination.cursor,
                      }
                    : null),
                },
              })
          )
          logger.info(pagination)
          differs = nextPage.cursor !== (pagination && pagination.cursor)
          if (differs) {
            tags.push(
              ...data.filter(tag => {
                const name = tag.localization_names['en-us']
                return findTags.includes(name) && !tags.includes(name)
              })
            )
          }
          pagination = nextPage
          await Promise.delay(100)
        } while (differs && pagination.cursor)
      } catch (err) {
        const message = 'No more tags?'
        logger.error(message, err)
        logger.info(
          tags
            .map(tag => `${tag.tag_id} (${tag.localization_names['en-us']})`)
            .join(', ')
        )
        return {
          error: message,
        }
      }
      return tags
    },
  }
  return api
}

export default function init() {
  const api = factory(createApi)

  return api
}
