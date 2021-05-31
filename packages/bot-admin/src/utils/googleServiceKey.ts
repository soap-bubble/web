import * as fs from 'fs'

const opts: {
  projectId?: string
  credentials?: { client_email: string; provate_key: string }
} = {}

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
    console.error('Failed to load service account', e)
  }
}
export const credentials = opts.projectId
  ? {
      projectId: opts.projectId,
      clientEmail: opts.credentials?.client_email,
      privateKey: opts.credentials?.provate_key,
    }
  : undefined
export default opts
