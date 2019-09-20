import { VideoController } from '../components/Videos'
import { MovieCast } from '../types'

interface Item extends VideoController {
  url: string
  movieCasts: MovieCast[]
  isPlaying: boolean
  isLoaded: boolean
  hasEnded: boolean
}

type State = Item[]
const initialVideosState: State = []

enum ActionTypes {
  CAN_PLAY_THROUGH,
  ENDED,
  PLAY,
  PAUSE,
  REF,
}

type ActionTypeStrings = keyof typeof ActionTypes

type VideoCastT = [HTMLVideoElement, string, MovieCast[]]

interface Action<T> {
  type: ActionTypeStrings
  payload: T
}

const itemDefaults = {
  isPlaying: false,
  isLoaded: false,
  hasEnded: false,
  el: null,
  movieCasts: [],
  play: () => {},
  pause: () => {},
}

export function reducer(state: State, action: Action<any>) {
  switch (action.type) {
    case 'CAN_PLAY_THROUGH': {
      const {
        payload: [el, url, movieCasts],
      } = action as Action<VideoCastT>
      const old = state.find(({ url: u }) => url == u)
      return [
        {
          ...itemDefaults,
          ...old,
          el,
          url,
          movieCasts,
        },
        ...(old ? state.filter(i => i === old) : state),
      ]
    }
  }
}
