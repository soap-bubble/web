import Queue from 'promise-queue';
import {
  reduce,
} from 'utils/asyncIteration';
import loggerFactory from 'utils/logger';

const logger = loggerFactory('scene:queue');

function cancellable(id, tasks) {
  let cancel = false;
  let lastIndex = 0;
  const selfie = {
    async execute() {
      logger.debug('cancellable:execute:start');
      return await reduce(
        tasks,
        async (memo, task, index) => {
          lastIndex = index;
          if (cancel) {
            logger.debug({
              index,
              id,
              message: 'Skipping cancelled task',
            });
            return memo;
          }
          logger.debug({
            index,
            id,
            message: 'Exceuting task',
          });
          return await task(memo);
        },
      );
    },
    cancel() {
      logger.debug(`Cancelling ${id} at ${lastIndex}`);
      cancel = true;
    },
  };
  return selfie;
}

export default function init() {
  const queue = new Queue(1, 3);
  const taskMap = {};

  const selfie = {
    add({
      id,
      tasks,
    }) {
      const job = taskMap[id] = cancellable(id, tasks);
      return queue
        .add(async () => await job.execute())
        .then((result) => {
          delete taskMap[id];
          return result;
        }, (error) => {
          logger.error({
            message: `Error execute queue tasks for ${id}`,
            error,
          });
          delete taskMap[id];
          throw error;
        });
    },
    isPending(id) {
      if (id) {
        return id in Object.keys(taskMap);
      }
      return Object.keys(taskMap).length;
    },
    cancel(id) {
      if (typeof id !== 'undefined') {
        const job = taskMap[id];
        if (job) {
          job.cancel();
        }
      } else {
        Object.values(taskMap).forEach((task) => {
          task.cancel();
        });
      }
    },
  };

  return selfie;
}
