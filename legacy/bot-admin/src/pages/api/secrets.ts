function getFromEnv(name: string) {
  if (!process.env[name]) {
    throw new Error(`Must define ENV['${name}']`)
  }
  return process.env[name] as string
}

export const client = getFromEnv('BOT_ADMIN_TWITCH_CLIENT_ID')
export const secret = getFromEnv('BOT_ADMIN_TWITCH_SECRET')
export const redirect_uri = getFromEnv('BOT_ADMIN_TWITCH_REDIRECT')
