module.exports = {
  authHost: 'http://localhost:4000/auth',
  origins: 'http://localhost:8050',
  auth: {
    token: '',
  },
  obs: {
    enabled: false,
    address: 'localhost:4444',
    profile: 'Morpheus',
    scenes: {
      start: 'Morpheus Fullscreen'
    }
  },
};
