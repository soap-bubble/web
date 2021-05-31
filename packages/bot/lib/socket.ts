import socketio from 'socket.io'
import { Express } from 'express'
import config from 'config'
import { Server } from 'http'
import bunyan from 'bunyan'

const logger = bunyan.createLogger({ name: 'soapbubble-bot-socket' })

const definition = {
  socket(app: Express, profileId: string) {
    const server = new Server(app)
    const io = socketio(server)

    logger.info('Socket server starting')

    io.origins(((origin: any, callback: any) => {
      logger.info('origin', origin, config.get('origins'))
      if (origin !== config.get('origins') && config.get('origins') !== '*') {
        return callback('origin not allowed', false)
      }

      callback(null, true)
    }) as any)
    // @ts-ignore
    io.on('error', err => logger.error(err))

    // @ts-ignore
    io.on('connect', socket => {
      // socket.join(`/${profileId}`)
      logger.info('connection', profileId)

      socket.on('init', ({ profileId }: { profileId: string }) => {
        logger.info('joining', profileId)
        socket.join(profileId)
      })
    })

    return {
      server,
      io,
      sawEmoji(id: number) {
        // logger.info(`sawEmoji: ${id} to profileId: ${profileId}`)
        // @ts-ignore
        io.sockets.to(profileId).emit('emoji', { id })
        // io.emit('emoji', { id })
      },
    }
  },
}

export { definition }
export type Socket = ReturnType<typeof definition['socket']>
