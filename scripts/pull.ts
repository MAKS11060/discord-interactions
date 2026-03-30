#!/usr/bin/env -S bun

import {DiscordApi, discordApi} from '#lib/discord.ts'
import {parseResponse} from '#lib/openapi-fetch.ts'
import {readFile, writeFile} from 'node:fs/promises'
import {authorize, clientId, getBearerToken, getToken} from './_utils.ts'


const token = await authorize()
console.log(token)

const {data: oauth2} = await parseResponse(
  discordApi.GET(DiscordApi.get_my_oauth2_authorization, {headers: {Authorization: getBearerToken(token)}}),
)
const application_id = oauth2.application.id

const {data: commands} = await parseResponse(
  discordApi.GET(DiscordApi.list_application_commands, {
    params: {path: {application_id}},
    headers: {Authorization: getBearerToken(token)},
  }),
)
console.dir(commands, {depth: null})

await writeFile(`.discord/${clientId}.json`, JSON.stringify({token, oauth2, commands}, null, 2))
