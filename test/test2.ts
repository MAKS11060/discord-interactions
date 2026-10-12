import {getEnvRequired} from '#env'
import * as discordRest from '#lib/api/discord/index.ts'
import {createDiscordOauth2, oauth2ClientCredentials, type OAuth2TokenResponse} from '@maks11060/oauth2'
import test from 'node:test'
import {schema} from '../example/builder.ts'
import '../example/commands/activity.ts'
import '../example/commands/message.ts'
import '../example/commands/slash.ts'
import '../example/commands/user.ts'
import {printSchema} from '../src/helper.ts'

let token: OAuth2TokenResponse
const getToken = async () => {
  token ??= await oauth2ClientCredentials(createDiscordOauth2({
    clientId: getEnvRequired('CLIENT_ID'),
    clientSecret: getEnvRequired('CLIENT_SECRET'),
    scope: ['identify', 'applications.commands.update'],
    redirectUri: '',
  }))

  return token
}

test('app info', async (t) => {
  const {data, error} = await discordRest.getMyOauth2Authorization({
    auth: (await getToken()).access_token,
  })

  console.log({
    user: {
      id: data?.user?.id,
      username: data?.user?.username,
    },
    application: data?.application,
    scopes: data?.scopes,
    expires: data?.expires,
  })
})

test('Print remote commands', async (t) => {
  const {data, error} = await discordRest.listApplicationCommands({
    auth: (await getToken()).access_token,
    path: {application_id: getEnvRequired('CLIENT_ID')},
  })

  printSchema(data, {showOptions: true})
})

test('upload test commands', async (t) => {
  const commands = schema.toJSON()
  printSchema(commands, {showOptions: true})

  const {data, error} = await discordRest.bulkSetApplicationCommands({
    auth: (await getToken()).access_token,
    path: {application_id: getEnvRequired('CLIENT_ID')},
    body: commands as any,
    headers: {},
  })
  console.dir(error, {depth: null})
  console.log(data)

  printSchema(data, {showOptions: true})
})
