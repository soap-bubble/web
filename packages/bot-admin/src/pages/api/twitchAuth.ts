import { IncomingMessage, ServerResponse } from 'http'
import { initializeApp, auth, credential, app } from 'firebase-admin'
import axios from 'axios'
import qs from 'qs'
import {
  client as clientID,
  secret as clientSecret,
  redirect_uri as callbackURL,
} from './secrets'
import { credentials } from '../../utils/googleServiceKey'

const init = (() => {
  let instance: app.App
  return () => {
    if (!instance) {
      instance = initializeApp({
        credential: credentials
          ? credential.cert(credentials)
          : credential.applicationDefault(),
        databaseURL: 'https://soapbubble-dev.firebaseio.com',
      })
    }
    return instance
  }
})()

export default async (req: IncomingMessage, res: ServerResponse) => {
  init()
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
