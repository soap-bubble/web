import { connect } from 'net'
import { request } from 'https'
import { NextApiRequest, NextApiResponse } from 'next'

import { createProxyServer } from 'http-proxy'

const proxy = createProxyServer({
  secure: false,
  changeOrigin: true,
  ignorePath: true,
})

const DOMAIN = 'static-cdn.jtvnw.net'
export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.query.u) {
    const path = (req.query.u as string).replace('/api/twitchEmoji', '/')
    proxy.web(req, res, { target: `https://${DOMAIN}/${path}` })
  }
}
