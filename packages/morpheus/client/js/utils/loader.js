import {
  remove,
} from 'lodash';
import Queue from 'promise-queue';

export default function ({
  concurrent = 3,
  filter,
  loader,
} = {}) {
  const toLoad = [];
  const loadingQueue = new Queue(concurrent, Infinity);

  function getNextItem() {
    return toLoad.reduce((curr, memo) => {
      if (!memo) {
        return curr;
      }
      if (curr.priority > memo.priority) {
        return curr;
      }
      return memo;
    });
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
    newItemsToLoad.forEach((id) => {
      toLoad.push({
        id,
        priority,
      });
      promises.push(loadingQueue.add(async () => {
        const idToLoad = getNextItem();
        remove(toLoad, n => n.id === idToLoad.id);
        await _loader(idToLoad);
      }));
    });
    return Promise.all(promises);
  }

  return {
    load,
  };
}
