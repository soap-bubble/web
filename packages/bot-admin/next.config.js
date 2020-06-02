// const withTM = require('next-transpile-modules')(['@juggle/resize-observer'])
// const path = require('path')
// const config = {
//   webpack: config => {
//     config.module.rules.push({
//       ...config.module.rules[0],
//       include: [...config.module.rules[0].include, /@juggle\/resize-observer/],
//       exclude: [],
//     })
//     console.log('before', config.module.rules[2])
//     return config
//   },
// }

module.exports = {
  env: {
    BOT_ADMIN_TWITCH_CLIENT_ID: process.env.BOT_ADMIN_TWITCH_CLIENT_ID,
    BOT_ADMIN_TWITCH_REDIRECT: process.env.BOT_ADMIN_TWITCH_REDIRECT,
    BOT_ADMIN_SOCKETIO: process.env.BOT_ADMIN_SOCKETIO,
  },
}

// module.exports.webpack = config => {
//   console.log('after', config.module.rules[0])
//   return config
// }
