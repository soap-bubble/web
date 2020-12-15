import {
  definition as profileDefinition,
  Profile,
  ProvideProfile,
  SaveProfile,
} from './profile.js'
import qs from 'qs'
import retry from 'async-retry'
import bunyan from 'bunyan'
import axios from 'axios'
import { oauth } from './utils.js'

const logger = bunyan.createLogger({ name: 'bot-twitch-api' })

const definition = {
  provideTwitchToken(twitchClientId: string, twitchClientSecret: string) {
    return (
      provideToken: ProvideProfile,
      saveToken: SaveProfile,
      grantType: 'refresh_token' | 'client_credentials'
    ) => {
      let twitchTokenAccess: string | null = null
      let twitchTokenRefresh: string | null
      let twitchTokenExpiresAt: number | null
      let isExpired: boolean
      let isExpiredTimeoutId: NodeJS.Timeout | null

      async function refresh(): Promise<{
        access_token: null | string
        refresh_token: null | string
        expires_in: null | number
      }> {
        logger.info('Refreshing token')
        const query = qs.stringify({
          grant_type: grantType,
          refresh_token: twitchTokenRefresh,
          client_id: twitchClientId,
          client_secret: twitchClientSecret,
        })
        try {
          return (
            await retry(
              async () =>
                await axios.post(`https://id.twitch.tv/oauth2/token?${query}`),
              {
                retries: 1,
              }
            )
          ).data
        } catch (err) {
          logger.error('Failed to refresh twitch token', err)
          return Promise.resolve({
            access_token: null,
            refresh_token: null,
            expires_in: null,
          })
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
        twitchTokenExpiresAt = null
      }

      async function tokenStatus() {
        if (!twitchTokenAccess) {
          logger.warn('No access token!')
          throw Error('No access token!')
        }
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
        if (twitchTokenExpiresAt) {
          const wait = Math.min(
            2147483647, // 32bit - 1 (max timeout length)
            Math.max(0, twitchTokenExpiresAt - 60000 - Date.now())
          )
          logger.info(`Setting refresh timeout to ${wait / 1000}s in future`)
          isExpiredTimeoutId = global.setTimeout(
            async function twitchTokenExpires() {
              logger.info('Token is expired because of timeout')
              isExpired = true
              isExpiredTimeoutId = null
              twitchTokenExpiresAt = null
              twitchTokenAccess = null
              twitchTokenAccess = await provideTwitchToken()
            },
            wait
          )
        }
      }

      async function provideTwitchToken() {
        if (!twitchTokenAccess) {
          try {
            const profile = await provideToken()
            if (profile) {
              twitchTokenAccess = profile.twitchTokenAccess
              twitchTokenRefresh = profile.twitchTokenRefresh
              twitchTokenExpiresAt = profile.twitchTokenExpiresAt
            } else {
              logger.warn('No profile found!')
            }
          } catch (error) {
            logger.info('Creating token')
            isExpired = true
          }
        }
        if (typeof isExpired === 'undefined') {
          try {
            const response = await tokenStatus()
            const {
              data: {
                token: { valid },
              },
            } = response
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
          logger.info('Token is expired... refreshing')
          const refreshResponse = await refresh()
          const saveTokenRequest: Partial<Profile> = {}
          const {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            expires_in: newExpiresIn,
          } = refreshResponse
          if (newAccessToken) {
            saveTokenRequest.twitchTokenAccess = twitchTokenAccess = newAccessToken
          }
          if (newRefreshToken) {
            saveTokenRequest.twitchTokenRefresh = twitchTokenRefresh = newRefreshToken
          }
          if (newExpiresIn) {
            saveTokenRequest.twitchTokenExpiresAt = twitchTokenExpiresAt =
              Date.now() + newExpiresIn * 1000

            logger.info('Update token on auth server')
            await saveToken(saveTokenRequest)
          }
          if (isExpiredTimeoutId) {
            clearTimeout(isExpiredTimeoutId)
          }
          setExpireTimeout()
          isExpired = false
        }
        if (!twitchTokenAccess) {
          throw new Error('Token not resolved')
        }
        return twitchTokenAccess
      }

      provideTwitchToken.expire = expire
      provideTwitchToken.reset = reset

      return provideTwitchToken
    }
  },
}

export { definition }

export type ProvideTwitchToken = ReturnType<
  typeof definition['provideTwitchToken']
>
