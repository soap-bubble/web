import {
  pull,
} from 'lodash';
import Queue from 'promise-queue';

export default function ({
  concurrent = 3,
  filter,
  loader,
} = {}) {
  const toLoad = [];
  const loaded = [];
  const loadingQueue = new Queue(concurrent, Infinity);

  function getNextItem() {
    return toLoad.reduce((memo, curr) => {
      if (!memo) {
        return curr;
      }
      if (curr.priority > memo.priority) {
        return curr;
      }
      return memo;
    }, null);
  }

  function load({
    item,
    priority = 0,
    filter: _filter = filter,
    loader: _loader = loader,
  } = {}) {
    const newItemsToLoad = _filter({
      toLoad,
      item,
    });
    const promises = [];
    newItemsToLoad
      .filter(id =>
        !toLoad.find(q => q.id === id)
        && loaded.indexOf(id) === -1,
      )
      .forEach((id) => {
        toLoad.push({
          id,
          priority,
        });
        promises.push(loadingQueue.add(async () => {
          const idToLoad = getNextItem();
          pull(toLoad, idToLoad);
          loaded.push(id);
          await _loader(idToLoad);
        }));
      });

    return Promise.all(promises);
  }

  function unload(item) {
    pull(loaded, item);
  }

  return {
    load,
    unload,
  };
}
