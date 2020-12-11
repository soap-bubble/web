import tmi from 'tmi.js'
import data from '../lib/core.json'
import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'bot-tmi' })

export default async function init(
  profileProvider,
  provideTwitchUserToken,
  twitchClientId,
  socket,
  onProfileChange
) {
  const { twitchUserName } = await profileProvider()
  let token = await provideTwitchUserToken()
  let client

  onProfileChange(async (change) => {
    if (change.data().twitchTokenAccess !== token) {
      logger.info('restarting client on profile change')
      try {
        await client.disconnect()
      } catch (e) {
        // ignore
      } finally {
        token = change.data().twitchTokenAccess
        api.connect()
      }
    } else if (!client) {
      logger.info('Starting client for the first time')
      api.connect()
    } else {
      logger.info('Not restarting client because token has not changed')
    }
  })

  const api = {
    say(message) {
      client.say(twitchUserName, `MrDestructoid ${message} MrDestructoid`)
    },
    connect() {
      logger.info('Connecting to twitch chat')
      const tmiOptions = {
        options: {
          clientId: twitchClientId,
          debug: true,
        },
        connection: {
          secure: true,
          reconnect: true,
        },
        identity: {
          username: twitchUserName,
          password: `oauth:${token}`,
        },
        channels: [twitchUserName],
      }
      client = new tmi.client(tmiOptions)

      client.on('message', (channel, tags, message, self) => {
        const foundEmojis = data.filter((emoji) => {
          const regex = new RegExp(emoji.regex)
          const match = message.match(regex)
          return !!match
        })
        for (const emoji of foundEmojis) {
          socket.sawEmoji(emoji.id)
        }
      })
      client.connect()
    },
  }

  // await api.connect()

  return api
}
