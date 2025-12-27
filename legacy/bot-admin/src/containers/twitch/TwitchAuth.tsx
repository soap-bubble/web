import React, { FunctionComponent, MouseEvent } from 'react'

const Bot: FunctionComponent<{
  onTwitchAuth: any
}> = ({ onTwitchAuth }) => {
  return (
    <form>
      <button type="button" className="btn btn-default" onClick={onTwitchAuth}>
        Authorize Twitch
      </button>
    </form>
  )
}

export default Bot
