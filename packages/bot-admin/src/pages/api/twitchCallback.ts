import { IncomingMessage, ServerResponse } from 'http'
import { v4 as uuid } from 'uuid'
import { Firestore } from '@google-cloud/firestore'
import axios from 'axios'
import qs from 'qs'
import {
  client as clientID,
  secret as clientSecret,
  redirect_uri as callbackURL,
} from './secrets'

export default async (req: IncomingMessage, res: ServerResponse) => {
  const db = new Firestore()

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
      const profileResponse = await axios.get('https://api.twitch.tv/kraken', {
        headers: {
          Authorization: `OAuth ${data.access_token}`,
          Accept: 'application/vnd.twitchtv.v5+json',
        },
      })
      const {
        data: {
          token: { user_id, user_name: twitchUserName },
        },
      } = profileResponse

      const collectionRef = db.collection('bot')
      const snapshot = await collectionRef
        .where('twitchId', '==', user_id)
        .get()

      let profileId: string
      if (snapshot.empty) {
        const docRef = await collectionRef.add({
          twitchId: user_id,
          twitchUserName,
          twitchTokenAccess: data.access_token,
          twitchTokenRefresh: data.refresh_token,
          twitchTokenExpiresIn: data.expires_in,
        })
        profileId = docRef.id
      } else {
        const [docSnap] = snapshot.docs
        const docRef = docSnap.ref
        await docRef.set(
          {
            twitchUserName,
            twitchTokenAccess: data.access_token,
            twitchTokenRefresh: data.refresh_token,
            twitchTokenExpiresIn: data.expires_in,
          },
          {
            merge: true,
          }
        )
        profileId = docRef.id
      }
      res.statusCode = 301
      res.setHeader('Location', `/obs/${profileId}`)
      return res.end('ok')
    }
  }
  res.statusCode = 500
  res.setHeader('Content-Type', 'application/json')
  return res.end('no ok')
}
