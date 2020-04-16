import axios from 'axios'
import retry from 'async-retry'
import qs from 'qs'
import { Firestore } from '@google-cloud/firestore'

export function fetchBotProfileProvider(profileId) {
  return async () => {
    const db = new Firestore()
    const docRef = db.doc(`bot/${profileId}`)
    const docSnap = await docRef.get()
    return docSnap.data()
  }
}

export function saveBotProflie(profileId) {
  return data => {
    const db = new Firestore()
    const docRef = db.doc(`bot/${profileId}`)
    docRef.set(
      {
        ...data,
      },
      { merge: true }
    )
  }
}
