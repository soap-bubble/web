import { definition as api } from './api.js'
import { definition as eventSub } from './eventSub.js'
import { definition as chat } from './chat.js'
import { definition as hook } from './hooks.js'
import { definition as profile } from './profile.js'
import { definition as subscriptions } from './subscriptions.js'
import { definition as token } from './token.js'
export const definition = {
  ...api,
  ...eventSub,
  ...chat,
  ...hook,
  ...profile,
  ...subscriptions,
  ...token,
}
