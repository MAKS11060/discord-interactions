import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {logger} from 'hono/logger'
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {InteractionBuilder} from '../builder.ts'
import {DiscordInteraction} from '../interactions.ts'
import {interactionHandler} from './hono.ts'

const appKey = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
const appSchema = new InteractionBuilder((t) => ({
  Context: t.$type<{logger: typeof console.log}>(),
}))
const app = new DiscordInteraction({publicKey: appKey.publicKey, schema: appSchema})
const appHono = new Hono()
  .use(cors())
  .use(logger())

appHono.post('/api/discord/interactions', interactionHandler(app, {logger: console.log}))

test('Hono interactionHandler passes a context factory result to command handlers', async () => {
  type Context = {value: string}
  const key = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  const schema = new InteractionBuilder((t) => ({
    Context: t.$type<Context>(),
  }))
  schema.slashCommands((t) => [
    t.command({
      name: 'context',
      resolve: (context, _args, ctx) => context.reply(ctx.value),
    }),
  ])
  const discordApp = new DiscordInteraction({publicKey: key.publicKey, schema})
  const hono = new Hono().post('/interactions', interactionHandler(discordApp, () => ({value: 'from factory'})))
  if (false) {
    // @ts-expect-error A schema without a context default requires a context argument.
    interactionHandler(discordApp)
  }
  const timestamp = '1728720000'
  const body = JSON.stringify({
    application_id: 'context-app',
    data: {id: 'command-id', name: 'context', type: 1},
    id: 'interaction-id',
    token: 'token',
    type: 2,
    version: 1,
  })
  const signature = await crypto.subtle.sign(
    'Ed25519',
    key.privateKey,
    new TextEncoder().encode(timestamp + body),
  )
  const response = await hono.request('/interactions', {
    method: 'POST',
    headers: {
      'X-Signature-Ed25519': new Uint8Array(signature).toHex(),
      'X-Signature-Timestamp': timestamp,
    },
    body,
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {type: 4, data: {content: 'from factory'}})
})

test('Test 238444', async (t) => {
  const key = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  const schema = new InteractionBuilder((t) => ({
    Context: t.$type({a: 1}),
    // Context: t.$type<{a: 2}>(),
  }))

  const discordApp = new DiscordInteraction({publicKey: key.publicKey, schema})

  interactionHandler(discordApp, {a: 1})
  interactionHandler(discordApp)
})
