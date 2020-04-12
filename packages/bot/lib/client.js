import Discord from 'discord.js'
import factory from './factory'
import twitchTags from './twitchTags'
import { createSelector } from 'reselect'

export default function(config, twitchChat) {
  const { token } = config.discord
  const client = new Discord.Client()

  function debugResponse(message, response) {
    if (config.debug === true) {
      message.reply(JSON.stringify(response, null, 2))
    }
    return response
  }

  const pingPong = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content === 'ping'
    },
    action(message) {
      factory(async function channelAction(twitchChat) {
        message.reply('pong')
        twitchChat.say('pong')
      })
    },
  }

  const getChannel = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' && message.content === 'channel'
      )
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const channel = await twitchApi.getChannel()
        message.reply(JSON.stringify(channel, null, 2))
      })
    },
  }

  const getStream = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' && message.content === 'stream'
      )
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const stream = await twitchApi.getMyStream()
        message.reply(JSON.stringify(stream, null, 2))
      })
    },
  }

  const startStream = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' &&
        message.content === 'start stream'
      )
    },
    action(message) {
      factory(async function channelAction(obsClient, obsConfig) {
        debugResponse(message, await obsClient.switchProfile(obsConfig.profile))
        debugResponse(
          message,
          await obsClient.switchScene(obsConfig.scenes.start)
        )
        debugResponse(message, await obsClient.startStream())
        message.reply('Stream started')
      })
    },
  }

  const stopStream = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' &&
        message.content === 'stop stream'
      )
    },
    action(message) {
      factory(async function channelAction(obsClient, obsConfig) {
        await obsClient.stopStream()
        message.reply('Stream stopped')
      })
    },
  }

  const listen = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' && message.content === 'listen'
      )
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        await twitchApi.listenForFollow()
        await twitchApi.listenForUserChanges()
        await twitchApi.listenForStreamChanges()
      })
    },
  }

  const tags = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content === 'tags'
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const id = await twitchApi.getMyUserId()
        const tags = await twitchApi.getTags(id)
        console.log(tags)
        const response = tags
          .map(tag => tag.localization_names['en-us'])
          .join(', ')
        message.reply(response)
      })
    },
  }

  const allTags = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' &&
        message.content.indexOf('find tags') === 0
      )
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const tagsToFind = message.content
          .split('find tags ')[1]
          .split(',')
          .map(t => t.trim())
        const tags = await twitchApi.findAllStreamTags(tagsToFind)
        //message.reply(response.map(r => JSON.stringify(r, null, 2)).join(', '));
        const response = tags
          .map(tag => `${tag.tag_id} (${tag.localization_names['en-us']})`)
          .join(', ')
        const tagMap = tags.reduce((memo, tag) => {
          const name = tag.localization_names['en-us']
          memo[name] = tag.tag_id
          return memo
        }, {})
        message.reply(JSON.stringify(tagMap, null, 2))
      })
    },
  }

  const addTag = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' &&
        message.content.indexOf('add tag') === 0
      )
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const tagsToAdd = message.content
          .split('add tag ')[1]
          .split(',')
          .map(t => t.trim())
        if (!tagsToAdd.length) {
          return message.reply('Specify one or more tags to add')
        }
        // const userId = await twitchApi.getMyUserId();
        const userId = await twitchApi.getMyUserId()
        console.log(userId)
        const myTags = await twitchApi.getTags(userId)
        const tagIdsToAdd = tagsToAdd
          .filter(
            tagName =>
              !myTags.find(
                myTag => myTag.localization_names['en-us'] === tagName
              )
          )
          .map(tagName => twitchTags[tagName])

        if (tagIdsToAdd.length === 0) {
          return message.reply('Already exists')
        }
        // await twitchApi.setTags(userId, []);
        await twitchApi.setTags(userId, [
          ...myTags.filter(t => !t.is_auto).map(t => t.tag_id),
          ...tagIdsToAdd,
        ])
        return message.reply('done')
      })
    },
  }

  const getMyUserId = {
    selector(message) {
      return message.channel.name === 'bot-admin' && message.content === 'id'
    },
    action(message) {
      factory(async function channelAction(twitchApi) {
        const userId = await twitchApi.getMyUserId()
        message.reply(userId)
      })
    },
  }

  const editStatus = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' &&
        message.content.indexOf('edit status ') === 0
      )
    },
    action(message) {
      const status = message.content.split('edit status ')[1]
      factory(async function channelAction(twitchApi) {
        await twitchApi.setChannel({
          status,
        })
        message.reply('done')
        twitchChat.say(`Setting status to "${status}"`)
      })
    },
  }

  const editGame = {
    selector(message) {
      return (
        message.channel.name === 'bot-admin' &&
        message.content.indexOf('edit game ') === 0
      )
    },
    action(message) {
      const game = message.content.split('edit game ')[1]
      factory(async function channelAction(twitchApi) {
        await twitchApi.setChannel({
          game,
        })
        message.reply('done')
        twitchChat.say(`Setting game to [${game}]`)
      })
    },
  }

  const notBotSelector = message => !message.author.bot
  const contentIncludes = text => message => message.content.includes(text)
  const adminChannelSelector = message => message.channel.name === 'bot-admin'
  const fetchEmojis = {
    selector: createSelector(
      notBotSelector,
      adminChannelSelector,
      contentIncludes('fetch emojis'),
      (notBot, admin, fetchEmojis) => notBot && admin && fetchEmojis
    ),
    action(message) {
      factory(async (twitchApi, storage) => {
        const { error, emoticons } = await twitchApi.getEmojis()
        if (error) {
          return message.reply(error)
        }
        await storage.upload(
          'cache/twitchEmojis.json',
          JSON.stringify(emoticons),
          {
            resumable: false,
            contentType: 'application/json',
            private: true,
          }
        )
        message.reply(`Loaded ${emoticons.length} emojis`)
      })
    },
  }

  function handleMessage(message, cb) {
    ;[
      addTag,
      allTags,
      pingPong,
      fetchEmojis,
      getChannel,
      getMyUserId,
      getStream,
      editStatus,
      editGame,
      tags,
      listen,
      startStream,
      stopStream,
    ].forEach(({ selector, action }) => {
      if (selector(message)) {
        action(message)
      }
    })
  }

  client.on('ready', () => {
    console.log('I am ready!')
  })

  client.login(token)

  client.on('message', handleMessage)

  const selfie = {
    client,
    on: client.on.bind(client),
    off: client.removeListener.bind(client),
    letsPlay(message) {
      client.guilds.forEach(guild => {
        const channel = guild.channels.find('name', 'letsplay')
        channel.send(message)
      })
    },
  }

  return selfie
}
