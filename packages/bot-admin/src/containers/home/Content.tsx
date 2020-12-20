import useTwitchConfig from '@branes/www/hooks/useTwitchConfig'
import React, { FunctionComponent, useCallback, useEffect } from 'react'
import TwitchAuth from './TwitchAuth'

const Content: FunctionComponent = () => {
  const { clientID, callbackURL } = useTwitchConfig()
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
      (document.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientID}&redirect_uri=${callbackURL}&response_type=code&scope=user:read:broadcast user:edit:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit channel_read channel_editor user:read:email`),
    [clientID, callbackURL]
  )

  return <TwitchAuth onTwitchAuth={onTwitchAuth} />
}

export default Content
