import React from 'react'
import storage from 'local-storage'
import { createSelector } from 'reselect'

export const game = (state: any) => state.game
export const morpheusCursor = createSelector(
  game,
  _game => _game.cursor,
)
export const cursorImg = createSelector(
  game,
  _game => _game.cursorImg,
)
export const canvas = createSelector(
  game,
  _game => _game.canvas,
)
export const width = createSelector(
  game,
  _game => _game.width,
)
export const height = createSelector(
  game,
  _game => _game.height,
)
export const location = createSelector(
  game,
  _game => _game.location,
)
export const top = createSelector(
  location,
  _location => _location && _location.y,
)
export const left = createSelector(
  location,
  _location => _location && _location.x,
)
export const volume = createSelector(
  game,
  _game => _game.volume,
)
export const htmlVolume = createSelector(
  volume,
  v => v / 100,
)
export const style = createSelector(
  width,
  height,
  location,
  (w, h, l) => ({
    width: `${w}px`,
    height: `${h}px`,
    left: `${l.x}px`,
    top: `${l.y}px`,
  }),
)
export const dimensions = createSelector(
  width,
  height,
  (_width, _height) => ({
    width: _width,
    height: _height,
  }),
)

export const isLoggedIn = createSelector(
  game,
  g => {
    return !!g.user
  },
)

export const isLoggingIn = createSelector(
  game,
  g => !!g.isLoginStart,
)

export const menuOpened = createSelector(
  game,
  g => g.menuOpen,
)

export const menuClosed = createSelector(
  game,
  g => !g.menuOpen,
)

export const settingsClosed = createSelector(
  game,
  g => !g.settingsOpen,
)

export const settingsOpened = createSelector(
  game,
  g => g.settingsOpen,
)

export const saveOpened = createSelector(
  game,
  g => g.saveOpen,
)

export const saveClosed = createSelector(
  game,
  g => !g.saveOpen,
)

export const savesAreLoading = createSelector(
  game,
  g => g.savesAreLoading,
)

export const saveId = createSelector(
  game,
  g => g.saveId,
)

export const isOpenSave = createSelector(
  saveId,
  s => !!s,
)

export const savesMeta = createSelector(
  game,
  g => {
    if (Array.isArray(g.savesMeta)) {
      return g.savesMeta
    }
    return []
  },
)

export const savesMetaError = createSelector(
  game,
  g => {
    if (!Array.isArray(g.savesMeta)) {
      return g.savesMeta
    }
    return null
  },
)

export const saveDefinition = createSelector(
  savesMeta,
  _saves =>
    _saves.map((save: any) => {
      const date = new Date(save.timestamp)
      return {
        key: save.saveId,
        title: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
      }
    }),
)

export const saveDelegate = createSelector(
  saveDefinition,
  sd => (index: number) => {
    const item = sd[index]
    const { title, key } = item
    const content = <div className="saveListItem">{title}</div>
    return {
      key,
      content,
    }
  },
)

export const saveSize = createSelector(
  saveDefinition,
  sd => sd.length,
)

export const browserSaveData = () => storage.get('save')

const menuDefinition = createSelector(
  browserSaveData,
  isOpenSave,
  (bsd, os) => {
    const menuData = []
    menuData.push({
      key: 'localSave',
      title: 'Save to local file',
    })
    menuData.push({
      key: 'browserSave',
      title: 'Save to browser',
    })
    if (bsd) {
      menuData.push({
        key: 'browserLoad',
        title: 'Load from browser',
      })
    }
    menuData.push({
      key: 'localLoad',
      title: 'Load from local file',
      localFile: true,
    })
    menuData.push({
      key: 'settings',
      title: 'Settings',
    })
    menuData.push({
      key: 'reload',
      title: 'Reload',
    })
    return menuData
  },
)

export const menuSize = createSelector(
  menuDefinition,
  md => md.length,
)

export const menuDelegate = createSelector(
  menuDefinition,
  md => (index: number) => {
    const item = md[index]
    const { title, key, localFile } = item
    const content = <div className="menuListItem">{title}</div>
    return {
      key,
      content,
    }
  },
)
