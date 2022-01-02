import { connect, useSelector } from "react-redux";
import React, { CSSProperties, FC, useMemo } from "react";
import { NewGame, selectors as gameSelectors } from "morpheus/game";
import { selectors as sceneSelectors } from "morpheus/scene";
import Menu from "../components/Menu";
import Settings from "./Settings";
import SaveList from "./SaveList";
import { Scene } from "morpheus/casts/types";
import { Main } from "morpheus/title";
import Stage from "morpheus/casts/containers/Stage";
import useBootMorpheus from "morpheus/app/hooks/useBootMorpheus";
import useScene from "morpheus/app/hooks/useScene";

function mapStateToProps(state: any) {
  return {
    style: gameSelectors.style(state),
    menuOpen: gameSelectors.menuOpened(state),
    settingsOpen: gameSelectors.settingsOpened(state),
    saveOpen: gameSelectors.saveOpened(state),
  };
}

const Game: FC<{
  id: string;
  className?: string;
  style: CSSProperties;
  menuOpen: boolean;
  settingsOpen: boolean;
  saveOpen: boolean;
}> = (props) => {
  const {
    id,
    className,
    style,
    menuOpen,
    settingsOpen,
    saveOpen,
  } = props

  useBootMorpheus();
  const scenes = useSelector(sceneSelectors.currentScenesData);
  
  const menu = [];
  if (menuOpen) {
    menu.push(<Menu />);
  }
  if (settingsOpen) {
    menu.push(<Settings />);
  }
  if (saveOpen) {
    menu.push(<SaveList />);
  }
  let content = null;
  if (scenes.length) {
    if (scenes.length === 1 && scenes[0].sceneId === 1) {
      content = <Main />;
    } else {
      content = <Stage stageScenes={scenes} />;
    }
  }
  return (
    <div id={id} className={className} style={style}>
      {content}
      {menu}
    </div>
  );
};

export default connect(mapStateToProps)(Game);
