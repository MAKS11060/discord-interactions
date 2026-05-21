import {DiscordInteraction} from '#app'
import {Hono} from 'hono'
import {logger} from 'hono/logger'
import {interactionHandler} from './hono.ts'

const app = new Hono()
app.use(logger())

const discordApp = new DiscordInteraction({
  publicKey: process.env.CLIENT_PUBLIC_KEY!,
})

app.post('/api/interactions', interactionHandler(discordApp))
