#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {interactionHandler} from '#adapter/hono.ts'
import {commandMapRegistry, DiscordInteraction, handler} from '#app'
import {DiscordSnowflake} from '#lib/snowflake.ts'
import {serve} from '#runtime'
import {ComponentType, MessageFlags} from 'discord-api-types/v10'
import {Hono} from 'hono'
import {logger} from 'hono/logger'
import {sleep} from '../utils.ts'
import * as commands from './commands.ts'

// Command handler
handler(commands.hello, {
  chatInput() {
    return {
      command(c) {
        console.log(c)

        return c.replyEphemeral(`hello ${c.me.username}`)
        return c.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# Hello\n### ${c.me.global_name}`,
            },
          ],
        })
      },
    }
  },
})

handler(commands.hello, { // deferred
  chatInput() {
    return {
      command(c) {
        // return c.replyDeferred(async (c) => {
        // console.log(c.interaction.id, DiscordSnowflake.parseDate(c.interaction.id))
        // // console.log(c.interaction.token)
        // console.log(c.interaction.data)
        // await sleep(2000)
        // const msg1 = await c.reply({content: 'hello', flags: MessageFlags.Ephemeral})
        // })

        const deferred = c.replyDeferred()
        return deferred
      },
    }
  },
})

handler(commands.hello, { // deferred
  chatInput() {
    return {
      command(c) {
        console.log(c)

        return c.replyModal({
          title: 'hello',
          custom_id: 'modal-1',
          components: [
            {
              type: ComponentType.Label,
              label: 'Choice?',
              component: {
                type: ComponentType.StringSelect,
                custom_id: 'choice_string',
                options: [
                  {label: '1', value: '1'},
                  {label: '2', value: '2'},
                ],
              },
            },
          ],
        })
      },
    }
  },
})

handler(commands.helloUser, {
  user(c) {
    console.log(c)
    // return c.replyEphemeral(`hello ${c.from.user.username}`)
    return c.reply({
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.TextDisplay,
          content: `## From:\n\`\`\`json\n${JSON.stringify(c, null, 2)}\`\`\``,
        },
      ],
    })
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
