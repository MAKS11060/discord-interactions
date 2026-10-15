import type {APIInteraction} from 'discord-api-types/v10'
import {InteractionResponseType, InteractionType} from 'discord-api-types/v10'
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {InteractionBuilder} from './builder.ts'
import {DiscordInteraction} from './interactions.ts'

function createInteraction(customId: string): APIInteraction {
  return {
    app_permissions: '0',
    application_id: 'application-id',
    attachment_size_limit: 8_000_000,
    authorizing_integration_owners: {},
    channel: {id: 'channel-id', type: 0},
    channel_id: 'channel-id',
    data: {component_type: 2, custom_id: customId},
    entitlements: [],
    id: 'interaction-id',
    message: {id: 'message-id'},
    token: 'token',
    type: InteractionType.MessageComponent,
    user: {id: 'user-id', username: 'user', discriminator: '0', avatar: null},
    version: 1,
  } as unknown as APIInteraction
}

const publicKey = await crypto.subtle.importKey(
  'raw',
  new Uint8Array(32),
  {name: 'Ed25519'},
  true,
  ['verify'],
)

test('component handlers dispatch by custom ID without originating message metadata', async () => {
  type Context = {requestId: string}
  const schema = new InteractionBuilder((t) => ({
    Context: t.$type<Context>(),
    CustomId: {createReply: 'global:create'},
  }))
  const handled: string[] = []
  schema.messageComponents((t) => [
    t.component({
      customId: schema.customId.createReply,
      resolve: (context, ctx) => {
        handled.push(ctx.requestId, context.customId)
        return context.reply('created a child message')
      },
    }),
    t.component({
      customId: (id) => id.startsWith('reply:'),
      resolve: (context, ctx) => {
        handled.push(ctx.requestId, context.customId)
        return context.reply('handled child message')
      },
    }),
  ])
  schema.config satisfies {
    Context: Context
    CustomId: {createReply: 'global:create'}
  }
  schema.customId.createReply satisfies 'global:create'

  const interaction = new DiscordInteraction({publicKey, schema})
  const firstResponse = await interaction.execute(createInteraction('global:create'), {requestId: 'request'})
  const childResponse = await interaction.execute(createInteraction('reply:123'), {requestId: 'request'})

  assert.deepEqual(handled, ['request', 'global:create', 'request', 'reply:123'])
  assert.equal(firstResponse.type, InteractionResponseType.ChannelMessageWithSource)
  assert.equal(childResponse.type, InteractionResponseType.ChannelMessageWithSource)
})

test('one handler can match multiple static custom IDs', async () => {
  const schema = new InteractionBuilder({})
  let handledId: string | undefined
  schema.messageComponents((t) => [
    t.component({
      customId: ['global:one', 'global:two'],
      resolve: (context) => {
        handledId = context.customId
        return context.reply('handled')
      },
    }),
  ])

  const interaction = new DiscordInteraction({publicKey, schema})
  const response = await interaction.execute(createInteraction('global:two'))

  assert.equal(handledId, 'global:two')
  assert.equal(response.type, InteractionResponseType.ChannelMessageWithSource)
})

test('static custom ID matches take precedence over predicates', async () => {
  const schema = new InteractionBuilder({})
  let handledBy: string | undefined
  schema.messageComponents((t) => [
    t.component({
      customId: (id) => id.startsWith('reply:'),
      resolve: () => {
        handledBy = 'predicate'
        return {type: InteractionResponseType.DeferredMessageUpdate}
      },
    }),
    t.component({
      customId: 'reply:delete',
      resolve: () => {
        handledBy = 'static'
        return {type: InteractionResponseType.DeferredMessageUpdate}
      },
    }),
  ])

  const interaction = new DiscordInteraction({publicKey, schema})
  await interaction.execute(createInteraction('reply:delete'))

  assert.equal(handledBy, 'static')
})

test('component without a matching handler gets an ephemeral response', async () => {
  const interaction = new DiscordInteraction({publicKey, schema: new InteractionBuilder({})})

  assert.deepEqual(await interaction.execute(createInteraction('unknown')), {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: 'The handler for this component was not found',
      flags: 64,
    },
  })
})
