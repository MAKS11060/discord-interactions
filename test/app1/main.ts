#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {interactionHandler} from '#adapter/hono.ts'
import {DiscordInteraction, handler, slashCommand} from '#app'
import {serve} from '#runtime'
import {Hono} from 'hono'
import {logger} from 'hono/logger'
import {hello, helloMessage, helloUser} from './commands.ts'

import type {} from 'discord:types'
import {DiscordSnowflake} from '#lib/snowflake.ts'
import {MessageFlags} from 'discord-api-types/v10'
import {sleep} from '../utils.ts'

// Command handler
// handler(hello, {
//   chatInput(c) {
//     console.log(c.interaction)
//     return c.reply(`Hello ${c.user?.global_name}`)
//   },
// })

handler(hello, {
  chatInput(c) {
    return c.replyDeferredEphemeral(async (c) => {
      console.log(c.interaction.id, DiscordSnowflake.parseDate(c.interaction.id))
      // console.log(c.interaction.token)
      console.log(c.interaction.data)

      await sleep(2000)
      const msg1 = await c.reply({content: 'hello', flags: MessageFlags.Ephemeral})
    })
  },
})

handler(helloUser, {
  user(c) {
    return c.replyEphemeral('Test ok')
  },
})

handler(helloMessage, {
  message(c) {
    return c.replyEphemeral('Test ok')
  },
})

// APP
const discordInteraction = new DiscordInteraction({
  publicKey: process.env.CLIENT_PUBLIC_KEY!,
  schema: {
    hello,
  },
})

// Hono
const app = new Hono()
app.use(logger())
app.post('/api/interactions', interactionHandler(discordInteraction))
serve(app.fetch)
