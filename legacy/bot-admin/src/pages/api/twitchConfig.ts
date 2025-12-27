import { IncomingMessage, ServerResponse } from 'http'
import { client as clientID, redirect_uri as callbackURL } from './secrets'

export default function(req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      clientID,
      callbackURL,
    })
  )
}
