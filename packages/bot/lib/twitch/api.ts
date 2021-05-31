import axios from 'axios'
import BluebirdPromise from 'bluebird'
import { IConfig } from 'config'
import {
  attemptWithRefreh,
  twitchApiNew,
  twitchApiV5,
  newAuthorizatedHeaders,
  v5AuthorizatedHeaders,
  clientHeaders,
} from './utils.js'
import factory, { define } from '../factory.js'
import bunyan from 'bunyan'
import {
  definition as profileDefinition,
  ProvideProfile,
  SaveProfile,
} from './profile.js'
import { ProvideTwitchToken } from './token.js'

const logger = bunyan.createLogger({ name: 'bot-twitch-api' })

const definition = {
  twitchClientId(config: IConfig) {
    return config.get('twitch.clientID')
  },
  twitchClientSecret(config: IConfig) {
    return config.get('twitch.secret')
  },
  async twitchLogin(provideProfile: ProvideProfile) {
    const profile = await provideProfile()
    return profile?.twitchUserName
  },
  profileId(config: IConfig) {
    return config.get('profileId')
  },
  provideTwitchUserToken(
    provideProfile: ProvideProfile,
    saveProfile: SaveProfile,
    provideTwitchToken: ProvideTwitchToken
  ) {
    return provideTwitchToken(provideProfile, saveProfile, 'refresh_token')
  },
  provideTwitchAppToken(provideTwitchToken: ProvideTwitchToken) {
    const saveAppProfile = profileDefinition.saveProfile('app-token')
    const provideAppProfile = profileDefinition.provideProfile('app-token')
    return provideTwitchToken(
      provideAppProfile,
      saveAppProfile,
      'client_credentials'
    )
  },
  twitchApi(twitchClientId: string, twitchLogin: string) {
    const provideTwitchUserToken = factory(
      (provideTwitchUserToken: ProvideTwitchUserToken) => provideTwitchUserToken
    ) as ProvideTwitchUserToken
    async function promiseV5AuthorizatedHeaders() {
      const token = await provideTwitchUserToken()
      return v5AuthorizatedHeaders(twitchClientId, token)
    }

    async function promiseNewAuthorizatedHeaders() {
      return {
        ...newAuthorizatedHeaders(await provideTwitchUserToken()),
        ...clientHeaders(twitchClientId),
      }
    }

    // https://api.twitch.tv/helix/users/follows?first=1&to_id=
    const api = {
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
              }),
            provideTwitchUserToken
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
              }),
            provideTwitchUserToken
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
      async getStreams({
        userIds = [],
        logins = [],
      }: {
        userIds?: string[]
        logins?: string[]
      }) {
        try {
          logger.info('getStreams', { userIds, logins })
          const { data } = await attemptWithRefreh(
            async () =>
              await axios.get(twitchApiNew('streams'), {
                headers: await promiseNewAuthorizatedHeaders(),
                params: {
                  user_id: userIds,
                  user_login: logins,
                },
              }),
            provideTwitchUserToken
          )
          return data.data
        } catch (err) {
          const message = 'Failed to get streams from twitch'
          logger.error(message, err)
          return {
            error: message,
          }
        }
      },
      async getUserId(channelName: string) {
        try {
          logger.info(`getUserId ${channelName}`)
          const { data } = await attemptWithRefreh(
            async () =>
              await axios.get(twitchApiNew('users'), {
                headers: await promiseNewAuthorizatedHeaders(),
                params: {
                  login: channelName,
                },
              }),
            provideTwitchUserToken
          )
          return data.data[0].id
        } catch (err) {
          const message = 'Failed to get user from twitch'
          logger.error(message, err)
          throw err
        }
      },
      async getUserName(id: string) {
        try {
          logger.info(`getUserId ${id}`)
          const { data } = await attemptWithRefreh(
            async () =>
              await axios.get(twitchApiNew('users'), {
                headers: await promiseNewAuthorizatedHeaders(),
                params: {
                  id,
                },
              }),
            provideTwitchUserToken
          )
          return data.data[0].login as string
        } catch (err) {
          const message = 'Failed to get user from twitch'
          logger.error(message, err)
          throw err
        }
      },
      async getEmojis() {
        try {
          logger.info('getEmojis')
          const { data } = await attemptWithRefreh(
            async () =>
              await axios.get(twitchApiV5('chat/emoticons'), {
                headers: {
                  ...clientHeaders(twitchClientId),
                  Accept: 'application/vnd.twitchtv.v5+json',
                },
              }),
            provideTwitchUserToken
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
      async getTags(userId: string) {
        try {
          logger.info('getTags')
          const { data } = await attemptWithRefreh(
            async () =>
              await axios.get(twitchApiNew('streams/tags'), {
                headers: await promiseNewAuthorizatedHeaders(),
                params: {
                  broadcaster_id: userId,
                },
              }),
            provideTwitchUserToken
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
      async setTags(userId: string, tags: string[]) {
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
              ),
            provideTwitchUserToken
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
              }),
            provideTwitchUserToken
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
      async setChannel(info: { status?: string; game?: string }) {
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
              ),
            provideTwitchUserToken
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
      async findAllStreamTags(findTags: string[]) {
        const tags: any[] = []

        try {
          logger.info('getAllStreamTags')
          let pagination: { cursor: string } | null = null
          let differs: boolean
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
                }),
              provideTwitchUserToken
            )
            logger.info(pagination)
            differs = nextPage.cursor !== (pagination && pagination.cursor)
            if (differs) {
              tags.push(
                ...data.filter((tag: any) => {
                  const name = tag.localization_names['en-us']
                  return findTags.includes(name) && !tags.includes(name)
                })
              )
            }
            pagination = nextPage
            await BluebirdPromise.delay(100)
          } while (differs && pagination && pagination.cursor)
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
  },
}

export { definition }

export type ProvideTwitchUserToken = ReturnType<
  typeof definition['provideTwitchUserToken']
>

export type TwitchApi = ReturnType<typeof definition['twitchApi']>
