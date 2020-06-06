import tmi from 'tmi.js'
import data from '../lib/core.json'

export default async function init(
  logger,
  profileProvider,
  provideTwitchUserToken,
  twitchClientId,
  socket,
  onProfileChange
) {
  const { twitchUserName } = await profileProvider()
  let client

  const api = {
    say(message) {
      client.say(twitchUserName, `MrDestructoid ${message} MrDestructoid`)
    },
    async connect() {
      const commandPrefix = '!'
      const token = await provideTwitchUserToken()
      console.log(twitchUserName, token)
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

      onProfileChange(change => {
        console.log('Change type:', change.type)
      })

      client.on('message', (channel, tags, message, self) => {
        const foundEmojis = data.filter(emoji => {
          const regex = new RegExp(emoji.regex)
          const match = message.match(regex)
          return !!match
        })
        for (const emoji of foundEmojis) {
          socket.sawEmoji(emoji.id)
        }
      })

      try {
        await client.connect()
      } catch (err) {
        logger.warn('Failed to connect to twitch chat')
      }
    },
  }

  await api.connect()

  return api
}
