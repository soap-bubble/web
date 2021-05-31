import * as fs from 'fs'
import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'bot-google-credentials' })

const opts = {}

if (
  !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  process.env.ROOT_SERVICE_ACCOUNT
) {
  try {
    const { project_id: projectId, client_email, private_key } = JSON.parse(
      process.env.DEPLOYMENT === 'cluster'
        ? process.env.ROOT_SERVICE_ACCOUNT
        : fs.readFileSync(process.env.ROOT_SERVICE_ACCOUNT, 'utf8')
    )
    Object.assign(opts, {
      projectId,
      credentials: {
        client_email,
        private_key,
      },
    })
  } catch (e) {
    logger.error('Failed to load service account', e)
  }
}

export default opts
