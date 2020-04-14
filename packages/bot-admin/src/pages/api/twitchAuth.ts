import { IncomingMessage, ServerResponse } from 'http'
import { v4 as uuid } from 'uuid'
import { Firestore } from '@google-cloud/firestore'
import admin, { auth, firestore, credential, app } from 'firebase-admin'
import axios from 'axios'
import qs from 'qs'
import {
  client as clientID,
  secret as clientSecret,
  redirect_uri as callbackURL,
} from './secrets'
import { readFileSync } from 'fs'
const serviceAccount = require('/home/user/soapbubble-dev-firebase-adminsdk-eptqi-2a6eaa2f23.json')

const init = (() => {
  let instance: app.App
  return () => {
    if (!instance) {
      instance = admin.initializeApp({
        credential: credential.cert(serviceAccount),
        databaseURL: 'https://soapbubble-dev.firebaseio.com',
      })
    }
    return instance
  }
})()

export default async (req: IncomingMessage, res: ServerResponse) => {
  const app = init()
  const db = firestore()
  const docRef = db.doc('bot/token')
  if (req.url) {
    const { code } = qs.parse(req.url.split('?')[1])
    const query = qs.stringify({
      client_id: clientID,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackURL,
    })
    const { status, data } = await axios.post(
      `https://id.twitch.tv/oauth2/token?${query}`
    )
    if (status === 200) {
      const {
        data: { _id: uid },
      } = await axios.get(`https://api.twitch.tv/kraken/user`, {
        headers: {
          Authorization: `OAuth ${data.access_token}`,
          Accept: 'application/vnd.twitchtv.v5+json',
        },
      })
      const token = await auth().createCustomToken(uid)

      res.statusCode = 301
      res.setHeader('Location', `/enter/${token}`)
      return res.end()
    }
  }
  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  return res.end('no ok')
}
