#!/usr/bin/env -S deno run -A --env-file

import {discordApi} from '#lib/discord.ts'
import {parseResponse} from '#lib/openapi-fetch.ts'
import {ApplicationCommandType} from 'discord-api-types/v10'
import {test} from 'node:test'
import {clientId, getToken} from './_utils.ts'

const token = await getToken()
discordApi.use({
  onRequest({request}) {
    request.headers.set('Authorization', `Bearer ${token.access_token}`)
  },
})

test('Test 017903', async (t) => {
  const {data, response} = await parseResponse(
    discordApi.POST('/applications/{application_id}/commands', {
      params: {path: {application_id: clientId}},
      body: {
        name: 'hello',
        // type: ApplicationCommandType.ChatInput,
        // type: ApplicationCommandType.Message,
        type: ApplicationCommandType.User,
      },
    }),
  )
  console.log(data)
})

test('List commands', async (t) => {
  const {data, response} = await parseResponse(
    discordApi.GET('/applications/{application_id}/commands', {
      params: {path: {application_id: clientId}},
    }),
  )
  console.dir(data, {depth: null})
})
