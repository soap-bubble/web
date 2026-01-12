import type { ThunkDispatch, ThunkAction } from 'redux-thunk'
import type { AnyAction } from 'redux'

// The root state is dynamically composed by createReducer
// Using a record type since each reducer registers itself
export type RootState = Record<string, unknown>

// App dispatch type that supports thunks
export type AppDispatch = ThunkDispatch<RootState, unknown, AnyAction>

// Type for thunk actions
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>
