import {
  useReducer,
  ReducerAction,
  DispatchWithoutAction,
  useCallback,
} from 'react'

const PUSH = 'push'
const EXPIRE = 'expire'

interface PushAction<T> {
  type: typeof PUSH
  payload: T
}
function pushActionCreator<T>(item: T): PushAction<T> {
  return {
    type: PUSH,
    payload: item,
  }
}

interface ExpireAction<T> {
  type: typeof EXPIRE
  payload: T
}
function expireActionCreator<T>(item: T): ExpireAction<T> {
  return {
    type: EXPIRE,
    payload: item,
  }
}

type Actions<T> = PushAction<T> | ExpireAction<T>

function reducer<T>(state: T[], action: Actions<T>): T[] {
  switch (action.type) {
    case PUSH:
      return [...state, action.payload]
    case EXPIRE:
      return state.filter(s => action.payload !== s)
  }
}

export default function<T>(delay: number): [T[], (item: T) => void] {
  const [state, dispatch] = useReducer<(state: T[], action: Actions<T>) => T[]>(
    reducer,
    [] as T[]
  )

  const pusher = useCallback(
    (item: T) => {
      dispatch(pushActionCreator(item))
      setTimeout(() => {
        dispatch(expireActionCreator(item))
      }, delay)
    },
    [dispatch]
  )

  return [state, pusher]
}
