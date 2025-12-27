import { ThenArg } from '../utils.js'
import { provide, save, onChange, ref } from '../db.js'

export interface Profile {
  twitchTokenAccess: string
  twitchTokenRefresh: string
  twitchTokenExpiresAt: number
  twitchUserName: string
  twitchId: string
  subscriptions?: string[]
}

const definition = {
  provideProfile(profileId: string) {
    return async () => {
      const profile = await provide<Profile>(`bot/${profileId}`)
      if (!profile) {
        throw new Error('Profile not found')
      }
      return profile
    }
  },
  onChangeProfile(profileId: string) {
    return (
      callback: (
        snapshot: FirebaseFirestore.DocumentSnapshot<Partial<Profile>>
      ) => void
    ) => onChange(`bot/${profileId}`, callback)
  },
  saveProfile(profileId: string) {
    return (data: Partial<Profile>) => save(`bot/${profileId}`, data)
  },
  refProfile(profileId: string) {
    return ref<Profile>(`bot/${profileId}`)
  },
}

export { definition }

export type ProvideProfile = ReturnType<typeof definition['provideProfile']>
export type OnChangeProfile = ReturnType<typeof definition['onChangeProfile']>
export type SaveProfile = ReturnType<typeof definition['saveProfile']>
export type RefProfile = ThenArg<ReturnType<typeof definition['refProfile']>>
