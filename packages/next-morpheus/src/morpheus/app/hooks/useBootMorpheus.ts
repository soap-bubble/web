import { useCallback, useEffect } from 'react';
import useThunkDispatch from 'utils/useThunkDispatch';
import {
  selectors as inputSelectors,
  actions as inputActions,
} from 'morpheus/input';
import { actions as castActions } from 'morpheus/casts';
import {
  selectors as sceneSelectors,
  actions as sceneActions,
} from 'morpheus/scene';
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import {
  data as titleSceneData,
  actions as titleActions,
} from 'morpheus/title';
import keycode from 'keycode';
import { actions as gameActions } from 'morpheus/game';
import useQueryParams from 'hooks/useQueryParams';
import { useSelector } from 'react-redux';

export default function useBootMorpheus() {
  const dispatch = useThunkDispatch();
  const qp = useQueryParams();
  const resize = useCallback(
    () =>
      dispatch(
        gameActions.resize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      ),
    [dispatch]
  );
  useEffect(() => {
    resize();
    dispatch(gameActions.setCursor(10000));
    dispatch(gamestateActions.fetchInitial()).then(() => {
      let savedGame;
      if (qp.reload && !qp.scene) {
        savedGame = dispatch(gameActions.browserLoad());
      }
      if (!qp.reload && qp.scene) {
        dispatch(sceneActions.startAtScene(qp.scene));
      }
      if (!qp.scene && !savedGame) {
        dispatch(sceneActions.runScene(titleSceneData)).then(() =>
          dispatch(titleActions.start())
        );
      }
    });
  }, [qp, dispatch]);

  const pressedKeys = useSelector(inputSelectors.pressedKeys);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keyName = keycode.names[event.which];
      if (!pressedKeys[keyName]) {
        dispatch(inputActions.keyDown(keyName));
      }
    },
    [dispatch, pressedKeys]
  );
  const onKeyUp = useCallback(
    (event: KeyboardEvent) => {
      dispatch(inputActions.keyUp(keycode.names[event.which]));
    },
    [dispatch]
  );
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [resize]);
}
