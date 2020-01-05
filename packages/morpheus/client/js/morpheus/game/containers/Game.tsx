import { connect } from 'react-redux'
import React, { CSSProperties } from 'react'
import { List } from 'immutable'
import PropTypes from 'prop-types'
import { NewGame, selectors as gameSelectors } from 'morpheus/game'
import { selectors as sceneSelectors } from 'morpheus/scene'
import Menu from '../components/Menu'
import Settings from './Settings'
import SaveList from './SaveList'
import { Scene } from 'morpheus/casts/types'
import { currentScenesData } from 'morpheus/scene/selectors'

function mapStateToProps(state: any) {
  return {
    stageScenes: sceneSelectors.currentScenesData(state),
    style: gameSelectors.style(state),
    menuOpen: gameSelectors.menuOpened(state),
    settingsOpen: gameSelectors.settingsOpened(state),
    saveOpen: gameSelectors.saveOpened(state),
  }
}

const Game = ({
  id,
  className,
  style,
  stageScenes,
  menuOpen,
  settingsOpen,
  saveOpen,
}: {
  id: string
  className?: string
  style: CSSProperties,
  stageScenes: List<Scene>
  menuOpen: boolean
  settingsOpen: boolean
  saveOpen: boolean
}) => {
  const menu = []
  if (menuOpen) {
    menu.push(<Menu />)
  }
  if (settingsOpen) {
    // @ts-ignore
    menu.push(<Settings />)
  }
  if (saveOpen) {
    menu.push(<SaveList />)
  }
  return (
    <div id={id} className={className} style={style}>
      {stageScenes.size && <NewGame stageScenes={stageScenes.toArray()} />}
      {menu}
    </div>
  )
}

Game.propTypes = {
  className: PropTypes.string,
  menuOpen: PropTypes.bool.isRequired,
  settingsOpen: PropTypes.bool.isRequired,
  saveOpen: PropTypes.bool.isRequired,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}

Game.defaultProps = {
  className: '',
  style: {},
}
// @ts-ignore
export default connect(mapStateToProps)(Game)
