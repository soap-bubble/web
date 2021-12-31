import { useCallback, useEffect } from 'react';
import useThunkDispatch from 'utils/useThunkDispatch';
import {
  selectors as inputSelectors,
  actions as inputActions,
} from 'morpheus/input';
import { actions as sceneActions } from 'morpheus/scene';
import { actions as gamestateActions } from 'morpheus/gamestate';
import {
  data as titleSceneData,
  actions as titleActions,
} from 'morpheus/title';
import keycode from 'keycode';
import { actions as gameActions } from 'morpheus/game';
import useQueryParams from 'hooks/useQueryParams';
import { useSelector } from 'react-redux';
import useSize from './useSize';
import useScene from './useScene';

export default function useBootMorpheus() {
  const dispatch = useThunkDispatch();
  const qp = useQueryParams();
  const { fetch, run } = useScene();
  useEffect(() => {
    let wasCancelled = false;
    dispatch(gameActions.setCursor(10000));
    dispatch(gamestateActions.fetchInitial()).then(() => {
      if (wasCancelled) {
        return;
      }
      let savedGame;
      if (qp.reload && !qp.scene) {
        savedGame = dispatch(gameActions.browserLoad());
      }
      if (!qp.reload && qp.scene) {
        if (Number.isFinite(qp.scene)) {
          fetch(Number(qp.scene));
        }
      }
      if (!qp.scene && !savedGame) {
        run(titleSceneData);
        titleActions.start();
      }
    });
    return () => {
      wasCancelled = true;
    };
  }, [qp.reload, qp.scene, dispatch]);

  const pressedKeys = useSelector(inputSelectors.pressedKeys);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keyName = keycode.names[event.which];
      if (!pressedKeys[keyName]) {
        dispatch(inputActions.keyDown(keyName));
      }
    },
    [dispatch, pressedKeys],
  );
  const onKeyUp = useCallback(
    (event: KeyboardEvent) => {
      dispatch(inputActions.keyUp(keycode.names[event.which]));
    },
    [dispatch],
  );
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);
}
