if (process.env.NODE_ENV === 'offline') {
  module.exports = [...require('morpheus.map.json')]
} else {
  module.exports = []
}
