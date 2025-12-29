import type { AnyAction } from 'redux'
import type { ThunkAction } from 'redux-thunk'
import type { Scene } from '../casts/types'

export type CastActionThunk<TReturn = Scene | void> = ThunkAction<
  Promise<TReturn> | TReturn,
  unknown,
  unknown,
  AnyAction
>

export function dispatchCastState(args: {
  event: string
  castState: unknown
  castType: string
  scene: Scene
}): AnyAction

export declare const lifecycle: Record<
  string,
  (scene: Scene) => CastActionThunk
>

export function forScene(scene: Scene): {
  update(updateEvent: unknown): ThunkAction<void, unknown, unknown, AnyAction>
  lifecycle: typeof lifecycle
} & Record<string, any>

export function unpreloadAll(): ThunkAction<
  Promise<void>,
  unknown,
  unknown,
  AnyAction
>
