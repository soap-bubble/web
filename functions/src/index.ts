import { credential, initializeApp } from 'firebase-admin'
import { config, https } from 'firebase-functions'
import fetchScene from './scene'
import fetchGamestates from './gamestates'
import primeDb from './prime'
import copyDb from './copy'
import logger from './logger'

if (process.env.NODE_ENV === 'development') {
  const serviceAccount = require('../serviceAccount.json')
  initializeApp({
    credential: credential.cert(serviceAccount),
    databaseURL: 'https://soapbubble.firebaseio.com',
  })
} else {
  initializeApp(config().firebase)
}

export const prime =
  process.env.NODE_ENV === 'development'
    ? https.onRequest(async (req, res) => {
        logger.info("let's go")
        try {
          const items = JSON.parse(req.body.toString('utf8'))
          await primeDb(items)
          res.status(200).send('OK')
        } catch (error) {
          logger.error(error)
          res.status(500).send(error)
        }
      })
    : null

export const copy =
  process.env.NODE_ENV === 'development'
    ? https.onRequest(async (req, res) => {
        logger.info("let's go")
        try {
          await copyDb()
          res.status(200).send('OK')
        } catch (error) {
          logger.error(error)
          res.status(500).send(error)
        }
      })
    : null

export const scene = https.onRequest(async (req, res) => {
  try {
    const sceneId = Number(req.query.id)
    if (sceneId) {
      const scene = await fetchScene(sceneId)
      if (scene) {
        return res.status(200).send(scene)
      }
      return res.status(404).send('NOT FOUND')
    }
    return res.status(400).send('ERROR')
  } catch (error) {
    logger.error(`Scene error`, error)
    return res.status(500).send('ERROR')
  }
})

export const gamestates = https.onRequest(async (req, res) => {
  try {
    const gamestates = await fetchGamestates()
    if (gamestates) {
      return res.status(200).send(gamestates)
    }
    return res.status(404).send('NOT FOUND')
  } catch (error) {
    logger.error('Gamestate error', error)
    return res.status(500).send('ERROR')
  }
})
