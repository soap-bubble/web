import { connect } from 'react-redux'
import React, { CSSProperties, FC } from 'react'
import { NewGame, selectors as gameSelectors } from 'morpheus/game'
import { selectors as sceneSelectors } from 'morpheus/scene'
import Menu from '../components/Menu'
import Settings from './Settings'
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

type StateProps = ReturnType<typeof mapStateToProps>
type OwnProps = {
  id: string
  className?: string
}
type GameProps = StateProps &
  OwnProps & {
    style?: CSSProperties | Record<string, string>
  }

const Game: FC<GameProps> = ({
  id,
  className = '',
  style,
  stageScenes,
  menuOpen,
  settingsOpen,
  saveOpen,
}: GameProps) => {
  const menu = []
  if (menuOpen) {
    menu.push(<Menu />)
  }
  if (settingsOpen) {
    // @ts-ignore
    menu.push(<Settings />)
  }
  if (saveOpen) {
    // menu.push(<SaveList />)
  }
  const resolvedStyle = (style ?? {}) as CSSProperties
  return (
    <div id={id} className={className} style={resolvedStyle}>
      {stageScenes.length && <NewGame stageScenes={stageScenes} />}
      {menu}
    </div>
  )
}

export default connect<StateProps, Record<string, never>, OwnProps, any>(
  mapStateToProps
)(Game)
