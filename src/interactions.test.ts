import assert from 'assert'
import type {APIInteraction} from 'discord-api-types/v10'
import {test} from 'node:test'
import {printSchema} from '../cli/helper.ts'
import {schema} from '../example/builder.ts'
import {DiscordInteraction} from './interactions.ts'

import '../example/commands/slash.ts'

const {publicKey, privateKey} = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])

test('printSchema', async (t) => {
  printSchema(schema)
})

test('Ping Pong', async (t) => {
  const discordInteraction = new DiscordInteraction({publicKey, schema})

  const res = await discordInteraction.execute({
    app_permissions: '562949953863680',
    application_id: '1097172825292406814',
    type: 1,
    version: 1,
  } as unknown as APIInteraction)

  assert.deepEqual(res, {type: 1}) // Pong
})

test('Test 834599', async (t) => {
  const discordInteraction = new DiscordInteraction({publicKey, schema})

  const res = await discordInteraction.execute({
    app_permissions: '562949953863680',
    application_id: '1097172825292406814',
    attachment_size_limit: 20971520,
    authorizing_integration_owners: {'0': '1213048588805083157'},
    channel: {
      default_auto_archive_duration: 10080,
      flags: 0,
      guild_id: '1213048588805083157',
      id: '1223906943987617833',
      last_message_id: '1559089630538899486',
      name: 'главная',
      nsfw: false,
      parent_id: null,
      permissions: '18014398509481983',
      position: 1,
      rate_limit_per_user: 0,
      topic: null,
      type: 0,
    },
    channel_id: '1223906943987617833',
    context: 0,
    data: {
      id: '1559020369002889316',
      name: 'all-options',
      options: [{name: 'integer', type: 4, value: 2}],
      type: 1,
    },
    entitlement_sku_ids: [],
    entitlements: [],
    guild: {features: [], id: '1213048588805083157', locale: 'en-US'},
    guild_id: '1213048588805083157',
    guild_locale: 'en-US',
    id: '1559090768864346172',
    locale: 'ru',
    member: {
      avatar: null,
      banner: null,
      communication_disabled_until: null,
      deaf: false,
      flags: 0,
      joined_at: '2024-03-01T09:02:00.933000+00:00',
      mute: false,
      nick: null,
      pending: false,
      permissions: '18014398509481983',
      premium_since: null,
      roles: ['1223907646852300863'],
      unusual_dm_activity_until: null,
      user: {
        avatar: 'b8bab71bc41f85d842ffb5ad35131ec1',
        avatar_decoration_data: null,
        clan: null,
        collectibles: null,
        discriminator: '0',
        display_name_styles: null,
        global_name: 'MAKS11060',
        id: '329655633668341760',
        primary_guild: null,
        public_flags: 64,
        username: 'maks11060',
        vad_colors: null,
      },
    },
    token:
      'aW50ZXJhY3Rpb246MTU1OTA5MDc2ODg2NDM0NjE3MjpuYTUzR2IybTFCb1R4bjBtSGw1Z1Q1RXZMNG05S2pCUk1NbGRJMllNRm1rMlhOV29aZEpYRDliSUoyQVBuczA4OHY1c0dUVjUxd1pyYW5LMkx6UndRNXM5UU43T3doalZKeUdsSDBpTlBSYnFuT1NzdFpRbjAycnlzdmgwUHAwZw',
    type: 2,
    version: 1,
  } as unknown as APIInteraction)

  // console.log(res)
  assert.deepEqual(res, {type: 4, data: {content: 'Received 2'}})
})

test('Test 345992', async (t) => {
  const discordInteraction = new DiscordInteraction({publicKey, schema})

  const res = await discordInteraction.execute({
    app_permissions: '562949953863680',
    application_id: '1097172825292406814',
    attachment_size_limit: 20971520,
    authorizing_integration_owners: {'0': '1213048588805083157'},
    channel: {
      default_auto_archive_duration: 10080,
      flags: 0,
      guild_id: '1213048588805083157',
      id: '1223906943987617833',
      last_message_id: '1559115517028081725',
      name: 'главная',
      nsfw: false,
      parent_id: null,
      permissions: '18014398509481983',
      position: 1,
      rate_limit_per_user: 0,
      topic: null,
      type: 0,
    },
    channel_id: '1223906943987617833',
    context: 0,
    data: {
      id: '1559020369002889317',
      name: 'command-tree',
      options: [
        {
          name: 'manage',
          options: [
            {
              name: 'create',
              options: [{name: 'amount', type: 4, value: 99}],
              type: 1,
            },
          ],
          type: 2,
        },
      ],
      type: 1,
    },
    entitlement_sku_ids: [],
    entitlements: [],
    guild: {features: [], id: '1213048588805083157', locale: 'en-US'},
    guild_id: '1213048588805083157',
    guild_locale: 'en-US',
    id: '1559115983938129980',
    locale: 'ru',
    member: {
      avatar: null,
      banner: null,
      communication_disabled_until: null,
      deaf: false,
      flags: 0,
      joined_at: '2024-03-01T09:02:00.933000+00:00',
      mute: false,
      nick: null,
      pending: false,
      permissions: '18014398509481983',
      premium_since: null,
      roles: ['1223907646852300863'],
      unusual_dm_activity_until: null,
      user: {
        avatar: 'b8bab71bc41f85d842ffb5ad35131ec1',
        avatar_decoration_data: null,
        clan: null,
        collectibles: null,
        discriminator: '0',
        display_name_styles: null,
        global_name: 'MAKS11060',
        id: '329655633668341760',
        primary_guild: null,
        public_flags: 64,
        username: 'maks11060',
        vad_colors: null,
      },
    },
    token:
      'aW50ZXJhY3Rpb246MTU1OTExNTk4MzkzODEyOTk4MDpwVHpWYzBjTjlMODRNTkpLZVQxSmdTVTNhdVljRVBYOUFac3pPVnF2OTJCamhNbE5xaXRKVU9VNlJPMlFwQnNZWlp5eFhQS2JPN1lRZUNjam9JZU9lb3RYSXhxaDZFT0hXU004bk1PZGlsQmpnYjNPTmxsY0htemVJbVlKZ1FMRg',
    type: 2,
    version: 1,
  } as unknown as APIInteraction)

  assert.deepEqual(res, {type: 4, data: {content: 'Create 99'}})
})
