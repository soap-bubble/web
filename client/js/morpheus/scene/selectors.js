import { createSelector } from 'reselect';

export const backgroundScene = createSelector(state => state.scene.backgroundScene);
export const currentScene = createSelector(state => state.scene.currentScene);
export const previousScene = createSelector(state => state.scene.previousScene);
export const isEntering = createSelector(state => state.scene.status === 'entering');
export const isExiting = createSelector(state => state.scene.status === 'exiting');
export const isLive = createSelector(state => state.scene.status === 'live');
