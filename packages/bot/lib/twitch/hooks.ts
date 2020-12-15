import express, { Express } from 'express'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import bunyan from 'bunyan'
import { IConfig } from 'config'
import {
  NotificationResponse,
  Subscription,
  SubscriptionEvent,
  SubscriptionStatus,
} from './eventSub.js'
import {
  ProvideSubscription,
  RemoveSubscription,
  SaveSubscription,
} from './subscriptions.js'

const logger = bunyan.createLogger({ name: 'bot-twitch-hooks' })

const getSubEnabled = (subscriptionId: string) => `${subscriptionId}:enabled`
interface Topic<T extends NotificationResponse> {
  subscriptionId: string
  listener: (body: T) => void
}

function sign(
  secret: string,
  messageId: string,
  timestamp: string,
  payload: string
) {
  const hmacMessage = messageId + timestamp + payload
  const signature = crypto
    .createHmac('sha256', secret)
    .update(hmacMessage)
    .digest('hex')
  return 'sha256=' + signature
}

const definition = {
  twitchSecret(config: IConfig) {
    return config.get('twitch.secret')
  },
  twitchWebhookEndpoint(config: IConfig) {
    return config.get('twitch.webhook')
  },
  twitchSaveChannels(config: IConfig) {
    return config.get('twitch.saveChannels')
  },
  twitchHooks(
    app: Express,
    twitchSecret: string,
    twitchWebhookEndpoint: string,
    provideSubscription: ProvideSubscription,
    saveSubscription: SaveSubscription,
    removeSubscription: RemoveSubscription
  ) {
    const url = new URL(twitchWebhookEndpoint)
    const topics: Topic<any>[] = []
    const eventSub = new EventEmitter()
    logger.info(`Creating webhook callback for ${url.pathname}`)

    app.post(
      url.pathname,
      express.json({
        verify: (req, _, buf) => {
          ;(req as any).rawBody = buf
        },
      }),
      async (req, res) => {
        logger.info('eventsub hook', { notification: req.body })
        const {
          subscription,
          event,
          challenge,
        } = req.body as NotificationResponse
        const {
          'twitch-eventsub-message-id': messageId,
          'twitch-eventsub-message-timestamp': timestamp,
          'twitch-eventsub-message-signature': signature,
        } = req.headers
        if (!(messageId && timestamp)) {
          logger.error(
            'Unable to verify signature because no twitch-eventsub-message-Id or twitch-eventsub-message-Timestamp found'
          )
          return res.status(400).send('Unable to verify signature')
        }

        const selfSign = sign(
          twitchSecret,
          messageId.toString(),
          timestamp.toString(),
          (req as any).rawBody
        )
        if (selfSign !== signature?.toString()) {
          logger.error(
            `Unable to verify signature. Expected ${selfSign} but got ${signature?.toString()}`
          )
          return res.status(400).send('Unable to verify signature')
        }
        const currentSubscription = await provideSubscription(subscription.id)
        if (
          currentSubscription &&
          currentSubscription.lastMessageId === messageId
        ) {
          logger.info('Duplicate request received from twitch. Ignoring', {
            body: req.body,
          })
          return res.status(200).send('echo.....')
        }

        await saveSubscription({
          ...subscription,
          lastMessageId: messageId.toString(),
        })
        if (
          subscription.status === 'webhook_callback_verification_pending' &&
          challenge
        ) {
          return res.status(200).send(challenge)
        }
        if (
          currentSubscription?.status ===
            'webhook_callback_verification_pending' &&
          subscription.status === 'enabled'
        ) {
          logger.info(`Notifying of ${subscription.id}:enabled event`)
          eventSub.emit(getSubEnabled(subscription.id), subscription)
        } else if (
          subscription.status &&
          ([
            'authorization_revoked',
            'user_removed',
            'webhook_callback_verification_failed',
          ] as SubscriptionStatus[]).includes(subscription.status)
        ) {
          logger.info('Removed subscription', { subscription })
          removeSubscription(subscription.id)
        }
        if (event) {
          eventSub.emit(subscription.id, event)
        }
        return res.status(200).send('OK')
      }
    )

    const hooks = {
      async listen<T extends SubscriptionEvent>(
        subscriptionId: string,
        listener: (body: T) => void,
        onEnabled?: (subscription: Subscription) => void
      ) {
        logger.info(`Checking if ${subscriptionId} is enabled`)
        const subscription = await provideSubscription(subscriptionId)
        if (onEnabled && subscription && subscription.status === 'enabled') {
          onEnabled(subscription)
        }
        logger.info(`Listening to ${subscriptionId} via webhook`)

        eventSub.on(subscriptionId, listener)
        if (onEnabled) {
          eventSub.on(getSubEnabled(subscriptionId), onEnabled)
        }

        return () => {
          eventSub.off(subscriptionId, listener)
          if (onEnabled) {
            eventSub.on(getSubEnabled(subscriptionId), onEnabled)
          }
        }
      },
    }
    return hooks
  },
}

export { definition }
export type TwitchHooks = ReturnType<typeof definition['twitchHooks']>
