import logger from './logger'
import { firestore } from 'firebase-admin'
import schedule from './utils/schedule'
import {
  badDeck1,
  badHarem,
  badCargoH,
  badAudio,
  negativeActionAtEnd,
  nextSceneChanges,
  soundCasts,
} from './updateData'

type BatchOp = (batch: FirebaseFirestore.WriteBatch) => void

export default async function update() {
  try {
    const db = firestore()
    const scenesRef = db.collection('scenes')
    const gamestatesRef = db.collection('gamestates')
    const castsRef = db.collection('casts')

    const batcher = schedule<BatchOp, void>(
      async results => {
        try {
          logger.info('Writing batch -- start')
          const batch = db.batch()
          for (let op of results) {
            op(batch)
          }
          await batch.commit()
          logger.info('Writing batch -- done')
        } catch (error) {
          logger.error('Batch error', error)
        }
      },
      {
        maxDelay: 500,
        maxSize: 500,
      },
    )

    /*
     * Bad fileName case
     */
    for (let castId of badDeck1) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        const data = {
          fileName: cast.fileName.replace('deck1', 'Deck1'),
        }
        if (data.fileName !== cast.fileName) {
          batcher((batch: FirebaseFirestore.WriteBatch) => {
            batch.set(ref, data, { merge: true })
          }).then(() => {
            logger.info('Patching deck1 to Deck1', { fileName: cast.fileName })
          })
        }
      }
    }

    for (let castId of badHarem) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        const data = {
          fileName: cast.fileName.replace('harem', 'Harem'),
        }
        if (data.fileName !== cast.fileName) {
          batcher((batch: FirebaseFirestore.WriteBatch) => {
            batch.set(ref, data, { merge: true })
          }).then(() => {
            logger.info('Patching harem to Harem', { fileName: cast.fileName })
          })
        }
      }
    }

    for (let castId of badCargoH) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        const data = {
          fileName: cast.fileName.replace('cargoH', 'CargoH'),
        }
        if (data.fileName !== cast.fileName) {
          batcher((batch: FirebaseFirestore.WriteBatch) => {
            batch.set(ref, data, { merge: true })
          }).then(() => {
            logger.info('Patching cargoH to CargoH', {
              fileName: cast.fileName,
            })
          })
        }
      }
    }

    for (let castId of badAudio) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        const data = {
          audioOnly: true,
        }
        if (data.audioOnly !== cast.audioOnly) {
          batcher((batch: FirebaseFirestore.WriteBatch) => {
            batch.set(ref, data, { merge: true })
          }).then(() => {
            logger.info(`Patching castId: ${castId} to be audio only`)
          })
        }
      }
    }

    for (let castId of negativeActionAtEnd) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        if (
          cast.looping === true &&
          cast.nextSceneId === 0 &&
          cast.startFrame === -cast.actionAtEnd
        ) {
          continue
        }
        const data = {
          looping: true,
          nextSceneId: 0,
          startFrame: -cast.actionAtEnd,
        }
        batcher((batch: FirebaseFirestore.WriteBatch) => {
          batch.set(ref, data, { merge: true })
        }).then(() => {
          logger.info(
            `Patching castId: ${castId} to normalize negative actionAtEnd`,
          )
        })
      }
    }

    for (let [castId, nextSceneId] of nextSceneChanges) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        if (cast.nextSceneId === nextSceneId) {
          continue
        }
        const data = {
          nextSceneId,
        }
        batcher((batch: FirebaseFirestore.WriteBatch) => {
          batch.set(ref, data, { merge: true })
        }).then(() => {
          logger.info(
            `Patching cast: ${castId} to have nextSceneId: ${nextSceneId}`,
          )
        })
      }
    }

    for (let castId of soundCasts) {
      const castRef = await castsRef.where('castId', '==', castId).get()
      for (let castDoc of castRef.docs) {
        const ref = castsRef.doc(castDoc.id)
        const cast = castDoc.data()
        if (typeof cast.looping === 'undefined') {
          continue
        }
        const data = {
          looping: true,
        }
        batcher((batch: FirebaseFirestore.WriteBatch) => {
          batch.set(ref, data, { merge: true })
        }).then(() => {
          logger.info(
            `Patching background sound cast: ${castId} to have audio looping`,
          )
        })
      }
    }

    // Drum cast script gen
    await (async function() {
      const drumCastRef = await castsRef.where('castId', '==', 710010).get()
      for (let drumDoc of drumCastRef.docs) {
        logger.info('START - drum scene update')
        const sceneRef = await scenesRef.where('sceneId', '==', 7100).get()
        for (let sceneDoc of sceneRef.docs) {
          const drumScene = sceneDoc.data()
          const data = {
            casts: drumScene.casts
              .filter((cast: any) => !(cast.ref && cast.ref.castId === 710010))
              .map((cast: any) => {
                if (cast.type === 1007) {
                  cast.param1 = 7100
                  cast.param3 += 1
                }
                return cast
              }),
          }
          batcher(batch => {
            batch.set(drumScene.id, data, { merge: true })
          })
          for (let i = 1; i <= 8; i++) {
            const castId = 710010 + i
            const ref = castsRef.doc(castId.toString())
            const fileName = `GameDB/OAsounds/drumsTOM${i - 1}`
            batcher(batch => {
              batch.set(ref, {
                castId,
                comparators: [
                  {
                    gameStateId: 7100,
                    testType: 0,
                    value: i,
                  },
                ],
                fileName,
                initiallyEnabled: true,
                looping: false,
                __t: 'SoundCast',
              })
            })
          }
        }

        batcher(batch => {
          const ref = gamestatesRef.doc()
          batch.set(ref, {
            stateId: 7100,
            initialValue: 0,
            minValue: 0,
            maxValue: 8,
            stateWraps: 0,
            value: 0,
          })
        })

        batcher(batch => {
          const ref = castsRef.doc(drumDoc.id)
          batch.delete(ref)
        })
      }
    })()
  } catch (error) {
    console.error(error)
  }
}
