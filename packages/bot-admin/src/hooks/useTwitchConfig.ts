import { useState, useEffect } from 'react'
import axios from 'axios'

let globalConfig = {
  clientID: '',
  callbackURL: '',
}
let loaded = false

export default function() {
  const [config, setConfig] = useState(globalConfig)
  useEffect(() => {
    if (!loaded) {
      axios.get<typeof globalConfig>('/api/twitchConfig').then(({ data }) => {
        setConfig(data)
        loaded = true
      })
    }
  }, [loaded, setConfig])

  return config
}
