self.addEventListener('message', async (event) => {
  const { type, id, data } = event.data
  
  if (type === 'fetch') {
    try {
      const response = await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: data.body
      })
      
      const responseData = {
        id: id,
        type: 'fetch',
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.arrayBuffer()
        }
      }
      
      event.ports[0].postMessage(responseData, [responseData.data.body])
    } catch (error) {
      event.ports[0].postMessage({
        id: id,
        type: 'error',
        error: error.message
      })
    }
  }
})
