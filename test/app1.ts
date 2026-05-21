#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {interactionHandler} from '#adapter/hono.ts'
import {DiscordInteraction, slashCommand} from '#app'
import {serve} from '#runtime'
import {Hono} from 'hono'
import {logger} from 'hono/logger'

// Command declaration
export const hello = slashCommand({
  name: 'hello',
  description: 'Hello World!',
})

// Command handler


// APP
const discordInteraction = new DiscordInteraction({
  publicKey: process.env.CLIENT_PUBLIC_KEY!,
  schema: {
    hello
  },
})

// Hono
const app = new Hono()
app.use(logger())
app.post('/api/interactions', interactionHandler(discordInteraction))
serve(app.fetch)

import type {} from 'discord:types'
