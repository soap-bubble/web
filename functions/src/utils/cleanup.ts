import nodeCleanup from 'node-cleanup'

const handlers: (() => void)[] = []

export function register(handler: () => void) {
  handlers.push(handler)
}

nodeCleanup((exitCode, signal): boolean | void => {
  Promise.all(handlers.map(h => Promise.resolve(h()))).then(() =>
    process.kill(process.pid, signal || undefined),
  )
  // Tell nodeCleanup that we will handle termination after async claenup
  nodeCleanup.uninstall()
  return false
})
