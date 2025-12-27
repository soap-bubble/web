import type { AnyAction } from 'redux'
import type { ThunkDispatch } from 'redux-thunk'
import type * as SceneActionsModule from '../scene/actions'
import type * as SceneSelectorsModule from '../scene/selectors'
import type * as GameActionsModule from '../game/actions'
import type * as GameSelectorsModule from '../game/selectors'
import type * as GamestateActionsModule from '../gamestate/actions'
import type * as GamestateSelectorsModule from '../gamestate/selectors'
import type * as InputActionsModule from '../input/actions'
import type * as InputSelectorsModule from '../input/selectors'
import configureStore from '../../store'

/**
 * Curated public TypeScript surface for Morpheus runtime consumers (Next, tests, etc).
 * These aliases keep `allowJs` innards contained while providing strongly typed entry points.
 */
export type SceneActions = typeof SceneActionsModule
export type SceneSelectors = typeof SceneSelectorsModule
export type GameActions = typeof GameActionsModule
export type GameSelectors = typeof GameSelectorsModule
export type GamestateActions = typeof GamestateActionsModule
export type GamestateSelectors = typeof GamestateSelectorsModule
export type InputActions = typeof InputActionsModule
export type InputSelectors = typeof InputSelectorsModule

export type MorpheusStore = ReturnType<typeof configureStore>
export type MorpheusState = ReturnType<MorpheusStore['getState']>
export type MorpheusDispatch = ThunkDispatch<
  MorpheusState,
  unknown,
  AnyAction
>

