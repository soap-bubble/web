import axios from 'axios'
import bunyan from 'bunyan'
import { ThenArg } from '../utils.js'
import { TwitchHooks } from './hooks.js'
import { ProvideSubscriptions, SaveSubscription } from './subscriptions.js'
import { ProvideTwitchToken } from './token.js'
import {
  attemptWithRefreh,
  clientHeaders,
  newAuthorizatedHeaders,
  twitchApiNew,
} from './utils.js'

const logger = bunyan.createLogger({ name: 'bot-twitch-hooks' })

export type SubscriptionStatus =
  | 'enabled'
  | 'webhook_callback_verification_pending'
  | 'webhook_callback_verification_failed'
  | 'notification_failures_exceeded'
  | 'authorization_revoked'
  | 'user_removed'

export type SubscriptionType =
  | 'channel.follow'
  | 'stream.online'
  | 'stream.offline'
interface BroadcasterCondition {
  broadcaster_user_id: string
}

interface UserCondition {
  user_id: string
}

type AllConditions = BroadcasterCondition | UserCondition
type BroadcasterRewardCondition = AllConditions & {
  reward_id: string
}

export type Condition = BroadcasterCondition | BroadcasterRewardCondition

export interface Subscription {
  id: string
  status?: SubscriptionStatus
  type: SubscriptionType
  version: '1'
  condition: Condition
  transport: {
    method: 'webhook'
    callback: string
  }
  created_at: string
}
interface SubscriptionResponse {
  data: Subscription[]
  total: number
  limit: number
}

type StreamType = 'live' | 'playlist' | 'watch_party' | 'premiere' | 'rerun'
export interface StreamOnlineEvent {
  id: string
  broadcaster_user_id: string
  broadcaster_user_name: string
  type: StreamType
}
export interface StreamOfflineEvent {
  broadcaster_user_id: string
  broadcaster_user_name: string
}

export type SubscriptionEvent = StreamOnlineEvent | StreamOfflineEvent

export interface NotificationResponse {
  challenge?: string
  subscription: Subscription
  event: SubscriptionEvent
}

interface ProviderTwichUserToken {
  (): Promise<string>
  reset(): void
}

const definition = {
  async twitchEventSub(
    twitchHooks: TwitchHooks,
    twitchWebhookEndpoint: string,
    provideTwitchAppToken: ReturnType<ProvideTwitchToken>,
    twitchClientId: string,
    twitchSecret: string,
    saveSubscription: SaveSubscription,
    provideSubscriptions: ProvideSubscriptions
  ) {
    const getSubscriptions = async (): Promise<Subscription[]> => {
      const { data } = await attemptWithRefreh(
        async () =>
          await axios.get(twitchApiNew('eventsub/subscriptions'), {
            headers: await promiseNewAuthorizatedHeaders(),
          }),
        provideTwitchAppToken
      )
      return data.data
    }
    const deleteSubscription = async (id: string) => {
      const { data } = await attemptWithRefreh(
        async () =>
          await axios.delete(twitchApiNew('eventsub/subscriptions'), {
            params: {
              id,
            },
            headers: await promiseNewAuthorizatedHeaders(),
          }),
        provideTwitchAppToken
      )
      return data
    }
    async function promiseNewAuthorizatedHeaders() {
      return {
        ...newAuthorizatedHeaders(await provideTwitchAppToken()),
        ...clientHeaders(twitchClientId),
      }
    }
    const starterSubscriptions = await getSubscriptions()
    logger.info(`Found ${starterSubscriptions.length} saved subscriptions`, {
      subscriptions: starterSubscriptions.map(s => s.id),
    })
    let deleteSubscriptions: Promise<void>[] = []

    // This is the first load of subscriptions. Since we are still creating the API that will handle in-app
    // subscriptions, no in-app subscriptions exist. We will save off subscriptions from the DB here and leave
    // them for awhile to see if we get any in-app listeners
    //
    // When we link these up to in-app requests, call
    let unknownSubscriptions = await Promise.all(
      starterSubscriptions
        .filter(subscription => {
          if (subscription.status === 'webhook_callback_verification_failed') {
            logger.info(`Deleting failed subscription ${subscription.id}`)
            deleteSubscriptions.push(deleteSubscription(subscription.id))
          }
          return true
        })
        .map(
          async subscription =>
            [
              subscription,
              await twitchHooks.listen(subscription.id, subsciption => {
                // Add a queue or clean this up sooner.
                logger.warn(
                  `Received notification from unknown subscription ${subscription.id}. Since no one is listening, this event was lost.`,
                  { subsciption }
                )
              }),
            ] as [Subscription, () => void]
        )
    )
    const removeUnknownSubscription = (subscriptionId: string) => {
      unknownSubscriptions = unknownSubscriptions.filter(
        ([s]) => s.id !== subscriptionId
      )
    }

    const matchType = (type: SubscriptionType) => (
      subscription: Subscription
    ) => subscription.type === type

    const matchCondition = (condition: Condition) => (
      subscription: Subscription
    ) =>
      (Object.keys(condition) as (keyof Condition)[]).every(
        key => condition[key] === subscription.condition[key]
      )

    await Promise.all(deleteSubscriptions)

    const createHook = async (
      type: SubscriptionType,
      condtion: Condition,
      listener: (body: StreamOnlineEvent) => void,
      onEnabled?: (subscription: Subscription) => void
    ) => {
      // Look for matching subscription
      const matchSubscription = (subscription: Subscription) =>
        [matchType(type), matchCondition(condtion)].every(m => m(subscription))

      // Check if any unknown subscriptions match
      const unknownSubscriptionTuple = unknownSubscriptions.find(
        ([subscription]) => matchSubscription(subscription)
      )
      if (unknownSubscriptionTuple) {
        const [unknownSubscription, unsubscribe] = unknownSubscriptionTuple
        logger.info(
          `Attaching to unbound subscription ${unknownSubscription.id}`
        )
        unsubscribe()
        removeUnknownSubscription(unknownSubscription.id)
        twitchHooks.listen(unknownSubscription.id, listener, onEnabled)
        return unknownSubscription
      }

      // Check if any known subscription match
      const currentSubscriptions = await provideSubscriptions()
      let currentSubscription = currentSubscriptions.find(matchSubscription)
      if (!currentSubscription) {
        currentSubscription = await api.subscribe(type, condtion)
        logger.info(`Creating new subscription ${currentSubscription.id}`)
        await saveSubscription(currentSubscription)
      }
      twitchHooks.listen(currentSubscription.id, listener, onEnabled)

      return currentSubscription
    }
    const api = {
      getSubscriptions,
      deleteSubscription,
      async streamOnline(
        broadcaster_user_id: string,
        listener: (body: StreamOnlineEvent) => void,
        onEnabled?: (subscription: Subscription) => void
      ) {
        return createHook(
          'stream.online',
          { broadcaster_user_id },
          listener,
          onEnabled
        )
      },
      async streamOffline(
        broadcaster_user_id: string,
        listener: (body: StreamOnlineEvent) => void,
        onEnabled?: (subscription: Subscription) => void
      ) {
        return createHook(
          'stream.offline',
          { broadcaster_user_id },
          listener,
          onEnabled
        )
      },
      async subscribe(
        topic: SubscriptionType,
        condition: Condition,
        version: string = '1'
      ) {
        logger.info(`subscribe:${topic}`)
        const {
          data: [data],
        } = await attemptWithRefreh(
          async () =>
            await axios.post(
              twitchApiNew('eventsub/subscriptions'),
              {
                type: topic,
                version,
                condition,
                transport: {
                  method: 'webhook',
                  callback: twitchWebhookEndpoint,
                  secret: twitchSecret,
                },
              },
              {
                headers: await promiseNewAuthorizatedHeaders(),
              }
            ),
          provideTwitchAppToken
        )
        logger.info('subscribe response', data)
        return data as Subscription
      },
      async unsubscribe(subscriptionId: string) {
        logger.info(`unsubscribe ${subscriptionId}`)
        const { data } = await attemptWithRefreh(
          async () =>
            await axios.delete(twitchApiNew('eventsub/subscriptions'), {
              params: { id: subscriptionId },
              headers: await promiseNewAuthorizatedHeaders(),
            }),
          provideTwitchAppToken
        )
        return data
      },
    }
    return api
  },
}

export { definition }

export type TwitchEventSub = ThenArg<
  ReturnType<typeof definition['twitchEventSub']>
>
