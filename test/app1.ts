import {serve} from '#runtime'
import {interactionHandler} from '#adapter/web.ts'
import {MessageFlags} from 'discord-api-types/v10'
import {DiscordInteraction} from '#app'

// APP
const discordInteraction = new DiscordInteraction({
  publicKey: process.env.CLIENT_PUBLIC_KEY!,
  // schema: {} as const
})

discordInteraction.onInteract((c) => {
  // return c.reply('hello')
  return c.reply({content: 'hello', flags: MessageFlags.Ephemeral})
})

// HTTP
serve(async (req) => {
  const url = new URL(req.url)
  if (req.method === 'POST' && url.pathname === '/api/interactions') {
    return await interactionHandler(req, discordInteraction)
  }
  return Response.json('404')
})
