import React, { FunctionComponent, useCallback, useEffect } from 'react'
import TwitchAuth from './TwitchAuth'

const Content: FunctionComponent = () => {
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (typeof token === 'string') {
      global.firebase
        .app()
        .auth()
        .signInWithCustomToken(token)
        .then(({ user }) => {
          console.log(user)
        })
    }
  }, [])
  const onTwitchAuth = useCallback(
    () =>
      (document.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.BOT_ADMIN_TWITCH_CLIENT_ID}&redirect_uri=${process.env.BOT_ADMIN_TWITCH_REDIRECT}&response_type=code&scope=user:read:broadcast user:edit:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit channel_read channel_editor user:read:email`),
    []
  )

  return <TwitchAuth onTwitchAuth={onTwitchAuth} />
}

export default Content
