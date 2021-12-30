import { useCallback } from 'react'
import { useEventCallback } from 'rxjs-hooks'
import { map, withLatestFrom } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { Cast } from '../types'

export type CastRef<T, C extends Cast> = [T, C[]]

export function eventStream<T, C extends Cast>(
  event$: Observable<[T, C[]]>,
  state$: Observable<CastRef<T, C>[]>
) {
  return event$.pipe(
    withLatestFrom(state$),
    map(([[ref, inCast], state]) => {
      if (ref) {
        return [...state, [ref, inCast]] as CastRef<T, C>[]
      }
      return [
        ...state.reduce((memo, e) => {
          const [ref, casts] = e
          if (!casts.find(c => inCast.includes(c))) {
            memo.push(e)
          } else if (casts.length == 1) {
            return memo
          } else {
            memo.push([ref, casts.filter(c => inCast.includes(c))])
          }
          return memo
        }, [] as CastRef<T, C>[]),
      ]
    })
  )
}

export default function useCastRefNoticer<T, C extends Cast>(): [
  CastRef<T, C>[],
  (ref: CastRef<T, C>) => void
] {
  const [onCastRefSpread, refs] = useEventCallback<[T, C[]], CastRef<T, C>[]>(
    eventStream,
    [] as CastRef<T, C>[]
  )

  const onCastRef = useCallback((ref: CastRef<T, C>) => onCastRefSpread(ref), [
    onCastRefSpread,
  ])
  return [refs, onCastRef]
}
''
