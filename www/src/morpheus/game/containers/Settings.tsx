import React, { useCallback } from "react";
import useThunkDispatch from "utils/useThunkDispatch";

import { closeSettings, fullscreen } from "../commands";
import Settings from "../components/Settings";

const SettingsComponent = () => {
  const dispatch = useThunkDispatch();
  const onClose = useCallback(
    () => dispatch(closeSettings()),
    [dispatch, closeSettings]
  );
  const onFullscreen = useCallback(
    () => dispatch(fullscreen),
    [fullscreen, dispatch]
  );
  return <Settings onClose={onClose} onFullscreen={onFullscreen} />;
};

export default SettingsComponent;
