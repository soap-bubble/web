import React, { FunctionComponent, useCallback } from 'react'
import TwitchAuth from './TwitchAuth'

const Content: FunctionComponent = () => {
  const onTwitchAuth = useCallback(
    () =>
      (document.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=sprlzg25iypn1s4id029ib17lscmq0&redirect_uri=http://localhost:3080/api/twitchCallback&response_type=code&scope=user:read:broadcast user:edit:broadcast channel:moderate chat:edit chat:read whispers:read whispers:edit channel_read channel_editor user:read:email`),
    []
  )

  return <TwitchAuth onTwitchAuth={onTwitchAuth} />
}

export default Content
