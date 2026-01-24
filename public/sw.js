importScripts("https://cdn.jsdelivr.net/gh/soap-phia/tinyjet@latest/tinyjet/scramjet.all.js");
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker()

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin + '/scramjet/')) {
    event.respondWith(
      scramjet.loadConfig().then(() => {
        return scramjet.fetch(event)
      }).catch((error) => {
        console.error('Scramjet error:', error)
        const url = event.request.url.replace('/scramjet/', '')
        return fetch(url)
      })
    )
  }
})