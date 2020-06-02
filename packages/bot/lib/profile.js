import axios from 'axios'
import retry from 'async-retry'
import qs from 'qs'
import { Firestore } from '@google-cloud/firestore'

export function fetchBotProfileProvider(profileId) {
  return async () => {
    const db = new Firestore()
    const docRef = db.doc(`bot/${profileId}`)
    const docSnap = await docRef.get()
    const ret = docSnap.data()
    console.log('fetchBotProfileProvider', ret)
    return ret
  }
}

export function saveBotProflie(profileId) {
  return async  => {
    const db = new Firestore()
    const docRef = db.doc(`bot/${profileId}`);

    console.log('saveBotProfile', data);

    await docRef.set(
      {
        ...data,
      },
      { merge: true }
    )
  }
}
