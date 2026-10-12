import assert from 'node:assert/strict'
import {test} from 'node:test'
import {InteractionBuilder} from '../builder.ts'
import {DiscordInteractions} from '../interactions.ts'
import {interactionHandler} from './web.ts'

const encoder = new TextEncoder()

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
