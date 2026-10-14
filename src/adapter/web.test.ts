import assert from 'node:assert/strict'
import {test} from 'node:test'
import {InteractionBuilder} from '../builder.ts'
import {DiscordInteraction, DiscordInteractions} from '../interactions.ts'
import {interactionHandler} from './web.ts'

const encoder = new TextEncoder()

async function signedRequest(key: CryptoKey, interaction: object): Promise<Request> {
  const timestamp = '1728720000'
  const body = JSON.stringify(interaction)
  const signature = await crypto.subtle.sign(
    'Ed25519',
    key,
    encoder.encode(timestamp + body),
  )
  return new Request('https://example.test/interactions', {
    method: 'POST',
    headers: {
      'X-Signature-Ed25519': new Uint8Array(signature).toHex(),
      'X-Signature-Timestamp': timestamp,
    },
    body,
  })
}

function commandInteraction(applicationId: string) {
  return {
    application_id: applicationId,
    data: {id: 'command-id', name: 'context', type: 1},
    id: 'interaction-id',
    token: 'token',
    type: 2,
    version: 1,
  }
}

test('interactionHandler selects the application key from application_id', async () => {
  const keyA = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  const keyB = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  const apps = new DiscordInteractions([
    {clientId: 'app-a', publicKey: keyA.publicKey, schema: new InteractionBuilder()},
    {clientId: 'app-b', publicKey: keyB.publicKey, schema: new InteractionBuilder()},
  ])
  const timestamp = '1728720000'
  const body = JSON.stringify({application_id: 'app-b', type: 1, version: 1})
  const signature = await crypto.subtle.sign(
    'Ed25519',
    keyB.privateKey,
    encoder.encode(timestamp + body),
  )

  const response = await interactionHandler(
    new Request('https://example.test/interactions', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': new Uint8Array(signature).toHex(),
        'X-Signature-Timestamp': timestamp,
      },
      body,
    }),
    apps,
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {type: 1})
})

test('interactionHandler accepts a context factory for required schema context', async () => {
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
  const app = new DiscordInteraction({publicKey: key.publicKey, schema})
  const request = await signedRequest(key.privateKey, commandInteraction('context-app'))
  const response = await interactionHandler(request, app, () => ({value: 'from factory'}))
  const valueResponse = await interactionHandler(
    await signedRequest(key.privateKey, commandInteraction('context-app')),
    app,
    {value: 'from value'},
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {type: 4, data: {content: 'from factory'}})
  assert.equal(valueResponse.status, 200)
  assert.deepEqual(await valueResponse.json(), {type: 4, data: {content: 'from value'}})

  if (false) {
    // @ts-expect-error A schema without a context default requires a context argument.
    await interactionHandler(request, app)
  }
})

test('interactionHandler uses the schema context default when omitted', async () => {
  type Context = {value: string}
  const key = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  const schema = new InteractionBuilder((t) => ({
    Context: t.$type<Context>({value: 'from schema'}),
  }))
  schema.slashCommands((t) => [
    t.command({
      name: 'context',
      resolve: (context, _args, ctx) => context.reply(ctx.value),
    }),
  ])
  const app = new DiscordInteraction({publicKey: key.publicKey, schema})
  const request = await signedRequest(key.privateKey, commandInteraction('context-app'))
  const response = await interactionHandler(request, app)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {type: 4, data: {content: 'from schema'}})
})

test('interactionHandler rejects an unknown application id', async () => {
  const key = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])
  const apps = new DiscordInteractions([
    {clientId: 'registered-app', publicKey: key.publicKey, schema: new InteractionBuilder()},
  ])
  const timestamp = '1728720000'
  const body = JSON.stringify({application_id: 'unknown-app', type: 1, version: 1})
  const signature = await crypto.subtle.sign(
    'Ed25519',
    key.privateKey,
    encoder.encode(timestamp + body),
  )

  const response = await interactionHandler(
    new Request('https://example.test/interactions', {
      method: 'POST',
      headers: {
        'X-Signature-Ed25519': new Uint8Array(signature).toHex(),
        'X-Signature-Timestamp': timestamp,
      },
      body,
    }),
    apps,
  )

  assert.equal(response.status, 401)
})
