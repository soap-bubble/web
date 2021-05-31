import minimist from 'minimist'
import { credential, initializeApp } from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve, join } from 'path'
import { up, down } from './migrations'
const args = minimist(process.argv.slice(process.argv.indexOf(__filename) + 1))
const databaseURL = (() => {
  switch (args._[0]) {
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
      throw new Error()
  }
})()

const direction = (() => {
  switch (args._[1]) {
    case 'up':
    case 'u':
      return 'up'
    case 'down':
    case 'd':
      return 'down'
    default:
      console.error('Add direction up/down')
      process.exit(1)
      throw new Error()
  }
})()

const migrationIndex = Number(args._[2])
if (Number.isNaN(migrationIndex)) {
  console.warn(`${migrationIndex} is not a valid index`)
  process.exit(1)
}

const serviceAccount = JSON.parse(
  readFileSync(resolve(join(__dirname, '../serviceAccount.json')), 'utf8')
)
initializeApp({
  credential: credential.cert(serviceAccount),
  databaseURL,
})
if (direction === 'up') {
  up(migrationIndex)
} else if (direction === 'down') {
  down(migrationIndex)
}
