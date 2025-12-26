let baseUrl = ''

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open('v1')
      .then(cache =>
        cache.addAll([
          `${baseUrl}/GameDB/Deck1/introMOV.webm`,
          `${baseUrl}/GameDB/OAsounds/claireSRMSC.mp3`,
          `${baseUrl}/GameDB/All/morpheus-background.jpg`,
          `${baseUrl}/GameDB/All/morpheus-title.png`,
          `${baseUrl}/gamestate`,
        ])
      )
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(clientResponse => {
      // caches.match() always resolves
      // but in case of success response will have value
      if (clientResponse !== undefined) {
        return clientResponse
      }
      return fetch(event.request)
        .then(serverResponse => {
          // response may be used only once
          // we need to save clone to put one copy in cache
          // and serve second one
          const responseClone = serverResponse.clone()

          if (event.request.indexOf(baseUrl) !== -1) {
            caches.open('v1').then(cache => {
              cache.put(event.request, responseClone)
            })
          }
          return serverResponse
        })
        .catch(error => console.error(error))
    })
  )
})
