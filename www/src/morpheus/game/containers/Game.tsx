import { connect } from "react-redux";
import React, { CSSProperties, FC, useMemo } from "react";
import { NewGame, selectors as gameSelectors } from "morpheus/game";
import { selectors as sceneSelectors } from "morpheus/scene";
import Menu from "../components/Menu";
import Settings from "./Settings";
import SaveList from "./SaveList";
import { Scene } from "morpheus/casts/types";
import { Main } from "morpheus/title";

function mapStateToProps(state: any) {
  return {
    stageScenes: sceneSelectors.currentScenesData(state),
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
  stageScenes: Scene[];
  menuOpen: boolean;
  settingsOpen: boolean;
  saveOpen: boolean;
}> = ({
  id,
  className,
  style,
  stageScenes,
  menuOpen,
  settingsOpen,
  saveOpen,
}: {
  id: string;
  className?: string;
  style: CSSProperties;
  stageScenes: Scene[];
  menuOpen: boolean;
  settingsOpen: boolean;
  saveOpen: boolean;
}) => {
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
  if (stageScenes.length) {
    if (stageScenes[0].sceneId === 1) {
      content = <Main />;
    } else {
      content = <NewGame stageScenes={stageScenes} />;
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
