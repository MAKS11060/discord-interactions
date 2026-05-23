#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {interactionHandler} from '#adapter/hono.ts'
import {commandMapRegistry, DiscordInteraction, handler} from '#app'
import {DiscordSnowflake} from '#lib/snowflake.ts'
import {serve} from '#runtime'
import {MessageFlags} from 'discord-api-types/v10'
import {Hono} from 'hono'
import {logger} from 'hono/logger'
import {sleep} from '../utils.ts'
import * as commands from './commands.ts'

// Command handler
// handler(hello, {
//   chatInput(c) {
//     console.log(c.interaction)
//     return c.reply(`Hello ${c.user?.global_name}`)
//   },
// })

handler(commands.hello, {
  // chatInput(c) {
  //   return c.replyDeferredEphemeral(async (c) => {
  //     console.log(c.interaction.id, DiscordSnowflake.parseDate(c.interaction.id))
  //     // console.log(c.interaction.token)
  //     console.log(c.interaction.data)

  //     await sleep(2000)
  //     const msg1 = await c.reply({content: 'hello', flags: MessageFlags.Ephemeral})
  //   })
  // },
  chatInput() {
    return {
      command(c) {
        console.log(c.interaction)
        // return c.replyEphemeral(`hello ${c.user.username}`)

        return c.reply({
          content: 'comp v2',
          flags: MessageFlags.IsComponentsV2,
        })
      },
    }
  },
})

handler(commands.helloUser, {
  user(c) {
    console.log(c.interaction)
    return c.replyEphemeral(`hello ${c.user.username}`)
  },
})

handler(commands.helloMessage, {
  message(c) {
    console.log(c.interaction)
    return c.replyEphemeral('Test ok')
  },
})

// APP
const discordInteraction = new DiscordInteraction({
  publicKey: process.env.CLIENT_PUBLIC_KEY!,
})

// Hono
const app = new Hono()
app.use(logger())
app.post('/api/interactions', interactionHandler(discordInteraction))
serve(app.fetch)
