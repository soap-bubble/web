import tmi from 'tmi.js'
import data from '../core.js'
import bunyan from 'bunyan'
import { OnChangeProfile, ProvideProfile } from './profile.js'
import { ProvideTwitchUserToken, TwitchApi } from './api.js'
import { Socket } from '../socket'
import { TwitchEventSub } from './eventSub.js'
import { debounce } from './utils.js'
import { GoogleStorage } from '../storage.js'

const logger = bunyan.createLogger({ name: 'bot-tmi' })

const definition = {
  twitchSaveChannelNames(config: any) {
    const {
      twitch: { saveChannelNames = [] },
    } = config
    return saveChannelNames
  },
  twitchSaveChannelIds(config: any) {
    const {
      twitch: { saveChannelIds = [] },
    } = config
    return saveChannelIds
  },
  async twitchChat(
    provideProfile: ProvideProfile,
    provideTwitchUserToken: ProvideTwitchUserToken,
    twitchClientId: string,
    socket: Socket,
    onChangeProfile: OnChangeProfile,
    twitchEventSub: TwitchEventSub,
    twitchSaveChannelNames: string[],
    twitchSaveChannelIds: string[],
    twitchApi: TwitchApi,
    storage: GoogleStorage
  ) {
    const { twitchUserName } = await provideProfile()
    let token = await provideTwitchUserToken()
    let client: tmi.Client

    const channelListenToIds = [
      ...(await Promise.all(
        twitchSaveChannelNames.map(async n => {
          const response = await twitchApi.getUserId(n)
          logger.info(`Fetching ${n} user id => ${response}`)
          return [n, response] as [string, string]
        })
      )),
      ...(await Promise.all(
        twitchSaveChannelIds.map(async id => {
          const response = await twitchApi.getUserName(id)
          logger.info(`Fetching ${id} user name => ${response}`)
          return [response, id] as [string, string]
        })
      )),
    ]

    logger.info('Listening to channels', {
      names: twitchSaveChannelNames,
      channels: channelListenToIds,
    })
    const activeChannelFilter = await (async () => {
      const savedChannelStream: any[] = await twitchApi.getStreams({
        userIds: channelListenToIds.map(([_, id]) => id),
      })
      logger.info({ savedChannelStream })
      return ([_, id]: [string, string]) =>
        savedChannelStream.find(s => s.user_id === id)
    })()
    let activeChannels: {
      id: string
      channel: string
      log: string
      start: Date
    }[] = channelListenToIds
      .filter(activeChannelFilter)
      .map(([channel, id]) => ({
        id,
        channel,
        log: '',
        start: new Date(),
      }))
    logger.info({ activeChannels })
    const reconnect = debounce(async () => {
      logger.info('restarting client on subscription change')
      try {
        await client.disconnect()
      } catch (e) {
        // ignore
      } finally {
        api.connect()
      }
    }, 500)
    const privateOnlineChannels = () => {
      logger.info(`Current channels online (${activeChannels.length})`, {
        channels: activeChannels.map(({ channel }) => channel),
      })
    }
    for (let [channelName, channelId] of channelListenToIds) {
      twitchEventSub.streamOnline(
        channelId,
        onlineEvent => {
          if (
            !activeChannels.find(
              ({ id }) => id === onlineEvent.broadcaster_user_id
            )
          ) {
            logger.info(`Channel ${channelName} has come online`)
            activeChannels.push({
              channel: channelName,
              id: onlineEvent.broadcaster_user_id,
              log: '',
              start: new Date(),
            })
            privateOnlineChannels()
            reconnect()
          } else {
            logger.info(
              `Already found an active channel ${channelName}, so ignoring this event`
            )
          }
        },
        subscription => {
          logger.info(`${channelName} event sub is ready`, {
            subscriptionId: subscription.id,
          })
        }
      )
      twitchEventSub.streamOffline(
        channelId,
        async offlineEvent => {
          const oldLength = activeChannels.length
          const removedChannels: typeof activeChannels = []
          activeChannels = activeChannels.filter(channel => {
            const { id } = channel
            const result = id !== offlineEvent.broadcaster_user_id
            if (!result) {
              removedChannels.push(channel)
            }
            return result
          })
          if (oldLength !== activeChannels.length) {
            logger.info(`Channel ${channelName} has gone offline`)
            privateOnlineChannels()
            reconnect()
          } else {
            logger.info(
              `Did not find an active channel ${channelName} to remove, so ignoring this event`
            )
          }
          for (let { channel, start, log } of removedChannels) {
            logger.info(`Uploading ${channel} logs`)
            await storage.upload(
              `chat_logs/${channel}/${start.getTime()}-to-${Date.now()}-chatlog.txt`,
              log,
              {
                resumable: false,
                contentType: 'application/json',
                private: true,
              }
            )
          }
        },
        subscription => {
          logger.info(`${channelName} event sub is ready`, {
            subscriptionId: subscription.id,
          })
        }
      )
    }
    const MAX_14 = Math.pow(2, 14)
    let intervalId = setInterval(async () => {
      for (let item of activeChannels) {
        const { channel, log, start } = item
        const now = new Date()
        if (log.length > MAX_14) {
          logger.info(`Uploading ${channel} logs`)
          await storage.upload(
            `chat_logs/${channel}/${start.getTime()}-to-${now.getTime()}-chatlog.txt`,
            log,
            {
              resumable: false,
              contentType: 'application/json',
              private: true,
            }
          )
          item.log = ''
          item.start = now
        }
      }
    }, 10000)
    process.on('SIGTERM', () => {
      clearInterval(intervalId)
      const work: Promise<void>[] = []
      for (let { channel, start, log } of activeChannels) {
        logger.info(`Uploading ${channel} logs before quit`)
        work.push(
          storage.upload(
            `chat_logs/${channel}/${start.getTime()}-to-${Date.now()}-chatlog.txt`,
            log,
            {
              resumable: false,
              contentType: 'application/json',
              private: true,
            }
          )
        )
      }
      Promise.all(work).then(() => process.exit(0))
    })
    onChangeProfile(async change => {
      const data = change.data()
      if (data) {
        if (data.twitchTokenAccess !== token) {
          logger.info('restarting client on profile change')
          try {
            await client.disconnect()
          } catch (e) {
            // ignore
          } finally {
            if (data.twitchTokenAccess) {
              token = data.twitchTokenAccess
              api.connect()
            }
          }
        } else if (!client) {
          logger.info('Starting client for the first time')
          api.connect()
        } else {
          logger.info('Not restarting client because token has not changed')
        }
      }
    })

    const api = {
      say(message: string) {
        client.say(twitchUserName, `MrDestructoid ${message} MrDestructoid`)
      },
      connect() {
        logger.info('Connecting to twitch chat')
        const tmiOptions = {
          options: {
            clientId: twitchClientId,
          },
          connection: {
            secure: true,
            reconnect: true,
          },
          identity: {
            username: twitchUserName,
            password: `oauth:${token}`,
          },
          channels: activeChannels.map(({ channel: name }) => name),
        }
        client = tmi.client(tmiOptions)

        client.on('message', (channel, tags, message, self) => {
          const foundChannel = activeChannels.find(
            ({ id }) => id === tags['room-id']
          )
          if (foundChannel) {
            foundChannel.log += `${tags.username}: ${message}\n`
          }
          const foundEmojis = data.filter(emoji => {
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

    return api
  },
}
export { definition }
export type TwitchChat = ReturnType<typeof definition['twitchChat']>
