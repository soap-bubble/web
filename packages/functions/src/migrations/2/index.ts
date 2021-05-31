import { collection, batch, query, where, Batch } from 'typesaurus'
import { SceneWithRefs } from '../../types'
import logger from '../../logger'
import schedule from '../../utils/schedule'

const sceneWithRefs = collection<SceneWithRefs>('scenes')
const missingCasts: { [key: number]: number[] } = {
  '218061': [218060],
}

type BatchOp = (batch: Batch) => void

const batcher = schedule<BatchOp, void>(
  async results => {
    try {
      logger.info('Writing batch -- start')
      const batchOps = batch()
      for (let op of results) {
        op(batchOps)
      }
      await batchOps.commit()
      logger.info('Writing batch -- done')
    } catch (error) {
      logger.error('Batch error', error)
    }
  },
  {
    maxDelay: 50,
    maxSize: 500,
  }
)

export async function up(): Promise<void> {
  const scenesToUpdate = await query(sceneWithRefs, [
    where('sceneId', 'in', Object.keys(missingCasts)),
  ])
  if (scenesToUpdate) {
    for (let { ref, data: scene } of scenesToUpdate) {
      const castsToAdd = missingCasts[scene.sceneId]
      if (
        castsToAdd.length &&
        !scene.casts.find(f => {
          const ref = (f as { ref: number }).ref
          return ref && !castsToAdd.includes(ref)
        })
      ) {
        batcher(({ update }) => {
          logger.info(`Adding [${castsToAdd.join(', ')}] to ${scene.sceneId}`)
          update(sceneWithRefs, ref.id, {
            casts: [...castsToAdd.map(c => ({ ref: c })), ...scene.casts],
          })
        })
      }
    }
  }
}

export async function down(): Promise<void> {
  const scenesToUpdate = await query(sceneWithRefs, [
    where('sceneId', 'in', Object.keys(missingCasts)),
  ])
  if (scenesToUpdate) {
    for (let { ref, data: scene } of scenesToUpdate) {
      const castsToRemove = missingCasts[scene.sceneId]
      if (
        castsToRemove.length &&
        !scene.casts.find(f => {
          const ref = (f as { ref: number }).ref
          return ref && castsToRemove.includes(ref)
        })
      ) {
        batcher(({ update }) => {
          logger.info(
            `Removing [${castsToRemove.join(', ')}] to ${scene.sceneId}`
          )
          update(sceneWithRefs, ref.id, {
            casts: scene.casts.filter(c => {
              const ref = (c as { ref: number }).ref
              return typeof ref === 'undefined' || castsToRemove.includes(ref)
            }),
          })
        })
      }
    }
  }
}
