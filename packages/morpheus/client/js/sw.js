self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then(cache =>
      cache.addAll([
        `${config.assetHost}/GameDB/Deck1/introMOV.webm`,
        `${config.assetHost}/GameDB/OAsounds/claireSRMSC.mp3`,
        `${config.assetHost}/GameDB/All/morpheus-background.jpg`,
        `${config.assetHost}/GameDB/All/morpheus-title.png`,
        `${config.assetHost}/api/gamestate`,
      ]),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((clientResponse) => {
    // caches.match() always resolves
    // but in case of success response will have value
    if (clientResponse !== undefined) {
      return clientResponse;
    }
    return fetch(event.request).then((serverResponse) => {
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
      const responseClone = serverResponse.clone();

      if (event.request.indexOf(config.assetHost) !== -1) {
        caches.open('v1').then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return serverResponse;
    })
    .catch(error => console.error(error));
  }));
});
