import bunyan from 'bunyan'
import { provide, save, remove } from '../db.js'
import { Subscription } from './eventSub.js'
import { RefProfile, SaveProfile } from './profile.js'

const logger = bunyan.createLogger({ name: 'bot-twitch-hooks' })

export interface AnnotatedSubscription extends Subscription {
  lastMessageId?: string
}

const getSubPath = (subscriptionId: string) =>
  `/subscriptions/${subscriptionId}`

const definition = {
  provideSubscription() {
    return (subscriptionId: string) =>
      provide<AnnotatedSubscription>(getSubPath(subscriptionId))
  },
  provideSubscriptions(refProfile: RefProfile) {
    return async () =>
      (
        await Promise.all(
          (refProfile.current.subscriptions || []).map(subscriptionId =>
            provide<AnnotatedSubscription>(getSubPath(subscriptionId))
          )
        )
      ).filter(s => !!s) as Subscription[]
  },
  saveSubscription(refProfile: RefProfile, saveProfile: SaveProfile) {
    return async (subscription: AnnotatedSubscription) => {
      const { current: profile } = refProfile
      if (profile) {
        const { subscriptions = [] } = profile
        if (!subscriptions.find(s => s === subscription.id)) {
          await saveProfile({
            subscriptions: [subscription.id, ...subscriptions],
          })
        }
      }

      await save(getSubPath(subscription.id), subscription)
    }
  },
  removeSubscription(refProfile: RefProfile, saveProfile: SaveProfile) {
    return async (subscriptionId: string) => {
      const { current: profile } = refProfile
      if (profile) {
        const { subscriptions = [] } = profile
        if (subscriptions.find(s => s === subscriptionId)) {
          await saveProfile({
            subscriptions: subscriptions.filter(s => s === subscriptionId),
          })
        }
      }
      await remove(getSubPath(subscriptionId))
    }
  },
}

export { definition }

export type SaveSubscription = ReturnType<typeof definition['saveSubscription']>
export type RemoveSubscription = ReturnType<
  typeof definition['removeSubscription']
>
export type ProvideSubscriptions = ReturnType<
  typeof definition['provideSubscriptions']
>
export type ProvideSubscription = ReturnType<
  typeof definition['provideSubscription']
>
