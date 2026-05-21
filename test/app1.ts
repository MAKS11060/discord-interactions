#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {interactionHandler} from '#adapter/hono.ts'
import {DiscordInteraction} from '#app'
import {serve} from '#runtime'
import {MessageFlags} from 'discord-api-types/v10'
import {Hono} from 'hono'
import {logger} from 'hono/logger'

// APP
const discordInteraction = new DiscordInteraction({
  publicKey: process.env.CLIENT_PUBLIC_KEY!,
  schema: {},
})

// Hono
const app = new Hono()
app.use(logger())
app.post('/api/interactions', interactionHandler(discordInteraction))
serve(app.fetch)
