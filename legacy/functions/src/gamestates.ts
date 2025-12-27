import { firestore } from 'firebase-admin'
import logger from './logger'

export default async function() {
  const db = firestore()
  logger.info('Loading gamestates')
  const doc = await db.collection('gamestates').get()
  return doc.docs.map(d => d.data())
}
