import { omit } from 'lodash';
import Immutable from 'immutable';
import { Gamestate, Scene } from 'morpheus/casts/types';
import { useEffect, useMemo, useState } from 'react';
import { fetchInitial } from 'service/gameState';
import 'service/firebase';

export default function useInitialGamestates() {
  const [gamestates, setGamestates] = useState<Gamestate[]>([]);
  const [err, setError] = useState<Error | undefined>();

  async function fetchGamestate(cancellable: { cancel: boolean }) {
    function doIfNotCancelled(doer: () => void) {
      if (!cancellable.cancel) {
        doer();
      }
    }
    try {
      const data = await fetchInitial();
      if (data) {
        doIfNotCancelled(() => setGamestates(data));
      } else {
        doIfNotCancelled(() =>
          setError(new Error(`Unable to fetch initial gamestate`))
        );
      }
    } catch (err) {
      doIfNotCancelled(() => {
        setError(err);
        setGamestates([]);
      });
    }
  }

  useEffect(() => {
    if (!(gamestates.length || err)) {
      const cancellable = { cancel: false };
      fetchGamestate(cancellable);
      return () => {
        cancellable.cancel = true;
      };
    }
  }, [gamestates, err]);

  return useMemo(() => {
    if (gamestates.length) {
      const gsMap = gamestates.reduce(
        (newState, gs) => newState.set(gs.stateId, gs),
        Immutable.Map<number, Gamestate>()
      );

      return {
        byId(id: number) {
          const maybeGs = gsMap.get(id);

          if (!maybeGs) {
            throw new Error(
              `VariableNotFound ${id} inside ${gsMap.size} elements`
            );
          }
          const gs = maybeGs;
          return {
            get value() {
              return gs.value;
            },
            get maxValue() {
              return gs.maxValue;
            },
            get minValue() {
              return gs.minValue;
            },
            get stateWraps() {
              return gs.stateWraps;
            },
            get stateId() {
              return id;
            },
          } as Gamestate;
        },
      };
    }
    return undefined;
  }, [gamestates]);
}
