import { MongoClient } from 'mongodb'
import { omit } from 'ramda'
import { firestore } from 'firebase-admin'
import schedule from './utils/schedule'
import logger from './logger'

type BatchOp = (batch: FirebaseFirestore.WriteBatch) => void

export default async function() {
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
  const noId = omit(['_id', '__v'])
  const db = firestore()
  const scenesRef = db.collection('scenes')
  const gamestatesRef = db.collection('gamestates')
  const castsRef = db.collection('casts')
  const client = await MongoClient.connect('mongodb://localhost', {
    useNewUrlParser: true,
  })
  const mongodb = client.db('morpheus_dev')
  const gamestatesCursor = mongodb.collection('gamestates').find()
  const promises = []
  while (await gamestatesCursor.hasNext()) {
    const gamestateAttr = await gamestatesCursor.next()
    const data = JSON.parse(JSON.stringify(noId(gamestateAttr)))
    promises.push(
      batcher(batch => {
        batch.set(gamestatesRef.doc(), data)
      }),
    )
  }

  const scenesCursor = mongodb.collection('scenes').find()
  while (await scenesCursor.hasNext()) {
    const scenesAttr = await scenesCursor.next()
    const data = JSON.parse(JSON.stringify(noId(scenesAttr)))
    promises.push(
      batcher(batch => {
        batch.set(scenesRef.doc(), data)
      }),
    )
  }

  const castsCursor = mongodb.collection('casts').find()
  while (await castsCursor.hasNext()) {
    const castsAttr = await castsCursor.next()
    const data = JSON.parse(JSON.stringify(noId(castsAttr)))
    promises.push(
      batcher(batch => {
        batch.set(castsRef.doc(), data)
      }),
    )
  }
  await Promise.all(promises)
}
