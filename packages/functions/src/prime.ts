import { credential, firestore, initializeApp } from 'firebase-admin'

import schedule from './utils/schedule'
import logger from './logger'
import { Scene, Cast, Gamestate } from './types'
import { argv } from 'process'
import { readFileSync } from 'fs'
import { resolve, join } from 'path'

type BatchOp = [(batch: FirebaseFirestore.WriteBatch, data: any) => void, any]

export default async function prime(items: any[]) {
  if (!Array.isArray(items)) {
    throw new Error("I don't parse single objects for some reason")
  }

  if (!items.length) {
    logger.warn('No objects to process')
  }
  const length = items.length
  logger.info(`Processing ${length} objects`)

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
          for (let [op, data] of results) {
            op(batch, data)
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
      }
    )

    const allScenes = (await scenesRef.get()).docs.map(d => d.data())
    const allGamestates = (await gamestatesRef.get()).docs.map(d => d.data())
    const allCasts = (await castsRef.get()).docs.map(d => d.data())

    const promises = []
    for (let i = 0; i < items.length; i++) {
      const { type, data } = items[i]
      if (i % 50 === 0) {
        logger.info(`Processed ${i} items`)
      }
      if (type === 'Scene') {
        const scene = data as Scene
        if (!allScenes.find(s => s.sceneId === scene.sceneId)) {
          promises.push(
            batcher([
              (batch: FirebaseFirestore.WriteBatch, data: any) => {
                const ref = scenesRef.doc()
                batch.set(ref, data)
              },
              scene,
            ])
          )
          logger.info('Adding scene')
        }
      } else if (type === 'GameState') {
        const gamestate = data as Gamestate
        if (!allGamestates.find(s => s.stateId === gamestate.stateId)) {
          promises.push(
            batcher([
              (batch: FirebaseFirestore.WriteBatch, data: any) => {
                const ref = gamestatesRef.doc()
                batch.set(ref, data)
              },
              gamestate,
            ])
          )
          logger.info('Adding gs')
        }
      } else {
        const cast = data as Cast
        if (!allCasts.find(s => s.castId === cast.castId)) {
          promises.push(
            batcher([
              (batch: FirebaseFirestore.WriteBatch, data: any) => {
                const ref = castsRef.doc()
                batch.set(ref, data)
              },
              {
                ...cast,
                __t: type,
              },
            ])
          )
          logger.info('Adding cast')
        }
      }
    }
    await Promise.all(promises)
    logger.info('DB primed')
  } catch (error) {
    logger.error('Failure to prime DB', error)
  }
}

if (argv[1] === __filename) {
  const databaseURL = (() => {
    switch (argv[2]) {
      case 'production':
      case 'prod':
      case 'p':
        return 'https://soapbubble.firebaseio.com'
      case 'development':
      case 'dev':
      case 'd':
        return 'https://soapbubble-dev.firebaseio.com'
      default:
        console.error('Add environment')
        process.exit(1)
        return ''
    }
  })()

  const serviceAccount = JSON.parse(
    readFileSync(resolve(join(__dirname, '../serviceAccount.json')), 'utf8')
  )
  initializeApp({
    credential: credential.cert(serviceAccount),
    databaseURL,
  })

  const items = JSON.parse(
    readFileSync(resolve(join(__dirname, '../morpheus.map.json')), 'utf8')
  )
  prime(items)
}
