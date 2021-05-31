import { connect } from 'react-redux'
import React, { CSSProperties, useMemo } from 'react'
import PropTypes from 'prop-types'
import { NewGame, selectors as gameSelectors } from 'morpheus/game'
import { selectors as sceneSelectors } from 'morpheus/scene'
import Menu from '../components/Menu'
import Settings from './Settings'
import SaveList from './SaveList'
import { Scene } from 'morpheus/casts/types'

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
  style: CSSProperties
  stageScenes: Scene[]
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
      {stageScenes.length && <NewGame stageScenes={stageScenes} />}
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
