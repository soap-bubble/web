/* eslint-disable import/no-extraneous-dependencies */
// NOTE: This file is useless to anyone who does not possess morpheus.map.json
import bunyan from 'bunyan'
import { sprintf } from 'sprintf'
import Promise from 'bluebird'
import { get } from 'lodash'

import { getModel } from './index'

const logger = bunyan.createLogger({ name: 'primeDb' })

export default function prime() {
  // eslint-disable-next-line global-require
  const items = require('../../morpheus.map.json')
  logger.info('Morpheus JSON loaded.')

  if (!Array.isArray(items)) {
    throw new Error("I don't parse single objects for some reason")
  }

  if (!get(items, 'length')) {
    logger.warn('No objects to process')
  }

  const length = items.length
  logger.info(sprintf('Processing %d objects', length))

  // Wait for everything
  return Promise.all(
    items.map(morpheusObj => {
      const Model = getModel(morpheusObj.type)
      if (Model) {
        const model = new Model(morpheusObj.data)
        return model.save()
      }
      return Promise.reject(`Failed to create DB Model for ${morpheusObj.type}`)
    }),
  )
    .then(
      everything => {
        logger.info(`Wrote ${everything.length} entries`)
      },
      err => {
        logger.error('Failed to load db because: ', { err })
      },
    )
    .catch(err => {
      logger.error('Failed to load morpheus data', { err })
      throw err
    })
}
