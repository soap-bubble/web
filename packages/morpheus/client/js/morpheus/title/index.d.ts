import type { ComponentType } from 'react'
import type { AnyAction } from 'redux'
import type { ThunkAction } from 'redux-thunk'
import type Main from './components/Main'
import type { Scene } from '../casts/types'

export declare const data: Scene

export declare const selectors: Record<string, (...args: unknown[]) => unknown>

export declare function reducer(state: unknown, action: AnyAction): unknown

export namespace actions {
  function leaving(): AnyAction
  function start(): AnyAction
  function done(): AnyAction
  function canvasCreated(
    canvas: HTMLCanvasElement | null
  ): ThunkAction<Promise<void>, unknown, unknown, AnyAction>
  function titleDone(): ThunkAction<Promise<void>, unknown, unknown, AnyAction>
}


export type { default as Main } from './components/Main'

declare const _default: {
  data: typeof data
  selectors: typeof selectors
  reducer: typeof reducer
  actions: typeof actions
  Main: typeof Main
}

export default _default
