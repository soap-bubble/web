import { connect } from 'react-redux'
import React from 'react'
import PropTypes from 'prop-types'
import castFactory from 'morpheus/casts/factory'
import { NewGame, selectors as gameSelectors } from 'morpheus/game'
import { selectors as sceneSelectors } from 'morpheus/scene'
import Menu from '../components/Menu'
import Login from './Login'
import Settings from './Settings'
import SaveList from './SaveList'

function mapStateToProps(state) {
  return {
    currentScene: sceneSelectors.currentSceneData(state),
    casts: castFactory(state),
    style: gameSelectors.style(state),
    menuOpen: gameSelectors.menuOpened(state),
    settingsOpen: gameSelectors.settingsOpened(state),
    saveOpen: gameSelectors.saveOpened(state),
    isLoggingIn: gameSelectors.isLoggingIn(state),
  }
}

const Game = ({
  casts,
  id,
  className,
  style,
  currentScene,
  menuOpen,
  settingsOpen,
  saveOpen,
  isLoggingIn,
}) => {
  const menu = []
  if (menuOpen) {
    menu.push(<Menu />)
  }
  if (isLoggingIn) {
    menu.push(<Login />)
  }
  if (settingsOpen) {
    menu.push(<Settings />)
  }
  if (saveOpen) {
    menu.push(<SaveList />)
  }
  return (
    <div id={id} className={className} style={style}>
      {currentScene && <NewGame sceneData={currentScene} />}
      {menu}
    </div>
  )
}

Game.propTypes = {
  isLoggingIn: PropTypes.bool.isRequired,
  className: PropTypes.string,
  menuOpen: PropTypes.bool.isRequired,
  settingsOpen: PropTypes.bool.isRequired,
  saveOpen: PropTypes.bool.isRequired,
  casts: PropTypes.arrayOf(PropTypes.mixed).isRequired,
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}

Game.defaultProps = {
  style: {},
}

export default connect(mapStateToProps)(Game)
