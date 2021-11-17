import Queue from 'promise-queue'
import { reduce, forEachSeries } from 'utils/asyncIteration'
import loggerFactory from 'utils/logger'

const logger = loggerFactory('scene:queue')

function cancellable(id: string, tasks: (() => Promise<any>)[]) {
  let cancel = false
  let lastIndex = 0
  const selfie = {
    async execute() {
      logger.debug('cancellable:execute:start')
      return await forEachSeries(
        tasks,
        async (task: () => Promise<any>, index: number) => {
          lastIndex = index
          if (cancel) {
            logger.debug('Skipping cancelled task', {
              index,
              id,
            })
          }
          logger.debug('Exceuting task', {
            index,
            id,
          })
          return await task()
        }
      )
    },
    cancel() {
      logger.debug(`Cancelling ${id} at ${lastIndex}`)
      cancel = true
    },
  }
  return selfie
}

export default function init() {
  const queue = new Queue(1, 3)
  const taskMap = {} as {
    [key: string]: {
      execute: () => void
      cancel: () => void
    }
  }

  const selfie = {
    async add({ id, tasks }: { id: string; tasks: (() => Promise<any>)[] }) {
      const job = (taskMap[id] = cancellable(id, tasks))
      try {
        const result = await queue.add(async () => await job.execute())
        return result
      } catch (error) {
        logger.error(`Error execute queue tasks for ${id}`, {
          error,
        })
        throw error
      } finally {
        delete taskMap[id]
      }
    },
    isPending(id?: string) {
      if (id) {
        return id in Object.keys(taskMap)
      }
      return Object.keys(taskMap).length
    },
    cancel(id?: string) {
      if (typeof id !== 'undefined') {
        const job = taskMap[id]
        if (job) {
          job.cancel()
        }
      } else {
        Object.values(taskMap).forEach(task => {
          task.cancel()
        })
      }
    },
  }

  return selfie
}
