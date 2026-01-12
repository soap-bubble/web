import { createSelector } from 'reselect'
import { selectors as gameSelectors } from 'morpheus/game'
import type { RootState } from 'store/types'

interface TitleState {
  canvas: HTMLCanvasElement | null
  camera: unknown
  renderer: unknown
  leaving: boolean
  done: boolean
}

export const root = (state: RootState) => state.title as TitleState

export const titleDimensions = createSelector(
  (state: RootState) => gameSelectors.dimensions(state),
  ({ width, height }: { width: number; height: number }) => ({
    width,
    height,
  })
)

export const titleStyle = createSelector(
  (state: RootState) => gameSelectors.location(state),
  (state: RootState) => gameSelectors.dimensions(state),
  (
    { x, y }: { x: number; y: number },
    { width, height }: { width: number; height: number }
  ) => ({
    width,
    height,
    left: x,
    top: y,
  })
)

export const renderElements = createSelector(
  root,
  ({ canvas, camera, renderer }) => ({
    canvas,
    camera,
    renderer,
    dimensionSelector: titleDimensions,
  })
)

export const isLeaving = createSelector(root, ({ leaving }) => leaving)

export const isDone = createSelector(root, ({ done }) => done)
