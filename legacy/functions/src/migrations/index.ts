import { collection, get, set, query, where } from 'typesaurus'
import logger from '../logger'

import * as m1 from './1'
import * as m2 from './2'

interface Migration {
  index: number
  migrated: boolean
}

const HEAD = '0'
const migrations = collection<Migration>('migrations')

// Because not using require.... build a static list of migrations....

interface Migrator {
  up(): Promise<void>
  down(): Promise<void>
}
const migrationIndex: { [key: number]: Migrator } = {
  '1': m1,
  '2': m2,
}

async function getHead() {
  let head = await get(migrations, HEAD)
  if (!head) {
    await set(migrations, HEAD, {
      index: 0,
      migrated: false,
    })
    return await get(migrations, HEAD)
  }
  return head
}

async function setLastIndex(migrationIndex: number, succes: boolean) {
  const head = await getHead()
  if (head) {
    await set(head.ref, {
      index: migrationIndex,
      migrated: succes,
    })
  }
}

export async function up(revision: number) {
  let lastMigrationIndex: number = 0
  let success: boolean = true

  logger.info('Starting mgiration')
  try {
    const head = await getHead()
    if (head) {
      const maxSavedIndex = head.data.index

      async function runMigration(index: number) {
        lastMigrationIndex = index
        const migrator = migrationIndex[index]
        const start = Date.now()
        try {
          logger.info(`${index}: Running migration`)
          await migrator.up()
        } catch (error) {
          logger.error(`${index}: Failed to run up migration`, error)
          success = false
          return false
        } finally {
          logger.info(`${index}: Done ${(Date.now() - start) / 1000}s`)
        }
        return true
      }
      if (maxSavedIndex < revision) {
        for (let index = maxSavedIndex + 1; index <= revision; index++) {
          const result = await runMigration(index)
          if (!result) {
            break
          }
        }
      }
    }
  } catch (error) {
    logger.error('Failed to run migrations.', error)
  }
  logger.info('Saving migration state')
  await setLastIndex(lastMigrationIndex, success)
}

export async function down(revision: number) {
  let lastMigrationIndex: number = 0
  let success: boolean = true

  logger.info('Starting mgiration')
  try {
    const migrationNeeds = await query(migrations, [
      where('index', '>=', revision),
      where('migrated', '==', true),
    ])
    if (migrationNeeds.length) {
      migrationNeeds.sort((a, b) => b.data.index - a.data.index)
      for (let {
        data: { index },
      } of migrationNeeds) {
        lastMigrationIndex = index
        const migrator = migrationIndex[index]
        const start = Date.now()
        try {
          logger.info(`${index}: Running down migration`)
          await migrator.down()
        } catch (error) {
          logger.error(`${index}: Failed to run down migration`, error)
          success = false
          break
        } finally {
          logger.info(`${index}: Done ${(Date.now() - start) / 1000}s`)
        }
      }
    } else {
      logger.info('No migrations need to run')
    }
  } catch (error) {
    logger.error('Failed to get migrations.', error)
  }
  logger.info('Saving migration state')
  await setLastIndex(lastMigrationIndex, success)
}
