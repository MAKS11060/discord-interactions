import type {APIMessageComponentInteraction} from 'discord-api-types/v10'
import {InteractionResponseType, InteractionType} from 'discord-api-types/v10'
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {MessageComponentContext} from './context.ts'

function createInteraction(): APIMessageComponentInteraction {
  return {
    app_permissions: '0',
    application_id: 'application-id',
    attachment_size_limit: 8_000_000,
    authorizing_integration_owners: {},
    channel: {id: 'channel-id', type: 0},
    channel_id: 'channel-id',
    data: {component_type: 2, custom_id: 'global:test'},
    entitlements: [],
    id: 'interaction-id',
    message: {id: 'message-id'},
    token: 'token',
    type: InteractionType.MessageComponent,
    user: {id: 'user-id', username: 'user', discriminator: '0', avatar: null},
    version: 1,
  } as unknown as APIMessageComponentInteraction
}

function createFetchSpy() {
  let request: Request | undefined
  const fetch = new Proxy(globalThis.fetch, {
    apply(_target, _thisArg, args: Parameters<typeof globalThis.fetch>) {
      const [input, init] = args
      request = input instanceof Request ? input : new Request(input, init)
      return Promise.resolve(Response.json({id: 'followup-id', content: 'done'}))
    },
  })
  return {
    fetch,
    get request() {
      return request
    },
  }
}

test('deferUpdate registers its async callback with waitUntil and forwards fetch and signal', async () => {
  const context = new MessageComponentContext(createInteraction())
  const spy = createFetchSpy()
  const controller = new AbortController()
  let scheduled: Promise<unknown> | undefined
  let callbackStarted = false

  const response = context.deferUpdate(async (deferred) => {
    callbackStarted = true
    await deferred.replyFollowup({content: 'done'})
  }, {
    fetch: spy.fetch,
    signal: controller.signal,
    waitUntil: (promise) => {
      scheduled = promise
    },
  })

  assert.deepEqual(response, {type: InteractionResponseType.DeferredMessageUpdate})
  assert.ok(scheduled)
  assert.equal(callbackStarted, true)

  await scheduled

  assert.equal(callbackStarted, true)
  assert.ok(spy.request)
  assert.equal(spy.request.signal.aborted, false)
  controller.abort()
  assert.equal(spy.request.signal.aborted, true)
  assert.equal(spy.request.url, 'https://discord.com/api/v10/webhooks/application-id/token')
})

test('deferReply registers its async callback with waitUntil and forwards fetch and signal', async () => {
  const context = new MessageComponentContext(createInteraction())
  const spy = createFetchSpy()
  const controller = new AbortController()
  let scheduled: Promise<unknown> | undefined

  const response = context.deferReply(async (deferred) => {
    await deferred.reply({content: 'done'})
  }, {
    fetch: spy.fetch,
    signal: controller.signal,
    waitUntil: (promise) => {
      scheduled = promise
    },
  })

  assert.deepEqual(response, {type: InteractionResponseType.DeferredChannelMessageWithSource})
  assert.ok(scheduled)
  await scheduled

  assert.ok(spy.request)
  assert.equal(spy.request.signal.aborted, false)
  controller.abort()
  assert.equal(spy.request.signal.aborted, true)
  assert.equal(
    spy.request.url,
    'https://discord.com/api/v10/webhooks/application-id/token/messages/@original',
  )
})
