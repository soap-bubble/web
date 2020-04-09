import axios from 'axios';
import retry from 'async-retry';
import qs from 'qs'
import { Firestore } from '@google-cloud/Firestore'

export function fetchBotProfileProvider(config, logger) {
  return async () => {
    const db = new Firestore
    const docRef = db.doc('bot/token')
    const docSnap = await docRef.get()
    return docSnap.data()
  }
}

export function saveBotProflie() {
  return (data) => {
    const db = new Firestore
    const docRef = db.doc('bot/token')
    docRef.set({
      ...data
    }, { merge: true })
  }
}
