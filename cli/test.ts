import {DiscordApi, discordApi} from '#/lib/discord.ts'
import {parseResponse} from '#/lib/openapi-fetch.ts'
import {getRequiredEnv} from '#/lib/utils.ts'
import {oauth2ClientCredentials} from '@maks11060/oauth2/client-credentials'
import {createDiscordOauth2} from '@maks11060/oauth2/providers'
import type {APIApplicationCommand, APIInteraction, RESTPostOAuth2ClientCredentialsResult} from 'discord-api-types/v10'
import * as ts from 'npm:typescript'
import applicationJson from '../.tmp/1097172825292406814.json' with {type: 'json'}

const clientId = getRequiredEnv('CLIENT_ID')
const clientSecret = getRequiredEnv('CLIENT_SECRET')

const getToken = async () => {
  const token = await oauth2ClientCredentials<RESTPostOAuth2ClientCredentialsResult>(
    createDiscordOauth2({
      clientId,
      clientSecret,
      redirectUri: '',
      scope: 'identify applications.commands.update',
    }),
  )

  return token
}

const getBearerToken = (token: RESTPostOAuth2ClientCredentialsResult) => {
  return `${token.token_type} ${token.access_token}`
}

Deno.test('Test Authorization', async (t) => {
  const token = await getToken()
  console.log(token)

  const {data} = await parseResponse(discordApi.GET(DiscordApi.get_my_oauth2_authorization, {
    headers: {
      Authorization: getBearerToken(token),
    },
  }))
  console.log(data)
})

Deno.test('Test 978242 Deploy command', async (t) => {
  const token = applicationJson.token ?? await getToken()
  console.log(token.access_token)

  const {data} = await parseResponse(discordApi.POST(DiscordApi.create_application_command, {
    headers: {Authorization: getBearerToken(token)},
    params: {
      path: {
        application_id: applicationJson.application.id,
      },
    },
    body: {
      name: 'hello',
      description: `Say 'world'`,
    },
  }))
  console.dir(data, {depth: null})
})

Deno.test('Test 978242 rename command', async (t) => {
  const token = applicationJson.token ?? await getToken()
  console.log(token.access_token)

  const {data} = await parseResponse(discordApi.PATCH(DiscordApi.update_application_command, {
    headers: {Authorization: getBearerToken(token)},
    params: {
      path: {
        application_id: applicationJson.application.id,
        command_id: '1462026903924768843',
      },
    },
    body: {
      name: 'hello',
      description: `Say 'world!'`,
    },
  }))
  console.dir(data, {depth: null})
})

Deno.test('Test 978243 Deploy command 2', async (t) => {
  const token = applicationJson.token ?? await getToken()
  console.log(token.access_token)

  const {data} = await parseResponse(discordApi.POST(DiscordApi.create_application_command, {
    headers: {Authorization: getBearerToken(token)},
    params: {
      path: {
        application_id: applicationJson.application.id,
      },
    },
    body: (await import('../test/commands/3-hello.ts')).default.toJSON() as any,
  }))
  console.dir(data, {depth: null})
})

Deno.test('save command to file', async (t) => {
  const token = applicationJson.token ?? await getToken()
  console.log(token.access_token)

  const {data} = await parseResponse(discordApi.GET(DiscordApi.list_application_commands, {
    headers: {Authorization: getBearerToken(token)},
    params: {path: {application_id: applicationJson.application.id}},
  }))
  console.dir(data, {depth: null})

  Deno.writeTextFileSync(
    fromFileUrl(import.meta.resolve(`./.commands.json`)),
    JSON.stringify(data, null, 2),
  )
})

Deno.test('Test 148966', async (t) => {
  const command = {
    id: '1462026903924768843',
    application_id: '1097172825292406814',
    version: '1462026903924768844',
    default_member_permissions: null,
    type: 1,
    name: 'hello',
    description: "Say 'world'",
    dm_permission: true,
    contexts: null,
    integration_types: [0, 1],
    nsfw: false,
  }

  //
  const sourceFile = ts.createSourceFile('a.ts', '', ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS)

  const one = ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('one'))

  const dec1 = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier('Numbers'),
    undefined,
    ts.factory.createUnionTypeNode([
      one,
    ]),
  )

  const dec2 = ts.factory.createTypeAliasDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier('Numbers'),
    undefined,
    ts.factory.createUnionTypeNode([
      one,
    ]),
  )

  const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed})
  console.log(printer.printNode(ts.EmitHint.Unspecified, dec1, sourceFile))
  console.log(printer.printNode(ts.EmitHint.Unspecified, dec2, sourceFile))

  // ts.factory.updateSourceFile()
  console.log(printer.printFile(sourceFile))
})

Deno.test('Test 451658', async (t) => {
  const command = {
    id: '1462026903924768843',
    application_id: '1097172825292406814',
    version: '1462026903924768844',
    default_member_permissions: null,
    type: 1,
    name: 'hello',
    description: "Say 'world!'",
    dm_permission: true,
    contexts: null,
    integration_types: [0, 1],
    nsfw: false,
  }

  // const c: Record<string, any> = {
  //   '1462026903924768843': {},
  // }
})

import type {DiscordInteractionDefaultExport} from '#/mod.ts'
import {ensureFile, expandGlob} from 'jsr:@std/fs'
import {fromFileUrl, toFileUrl} from 'jsr:@std/path'

Deno.test('Test 557697', async (t) => {
  await ensureFile('test/commands/-index.ts')

  for await (const entry of expandGlob('test/commands/*.ts')) {
    const mod = await import(toFileUrl(entry.path).toString()) as DiscordInteractionDefaultExport
    console.log(mod)
  }
})

Deno.test('Test 798672', async (t) => {
  console.log((async () => {
    await ensureFile('test/commands/-index.ts')

    for await (const entry of expandGlob('test/commands/*.ts')) {
      const mod = await import(toFileUrl(entry.path).toString()) as DiscordInteractionDefaultExport
      console.log(mod)
    }
  }).toString())
})

// ---
Deno.test('generate types', async (t) => {
  const commands = JSON.parse(
    Deno.readTextFileSync(fromFileUrl(import.meta.resolve(`./.commands.json`))),
  ) as APIApplicationCommand[]

  // gen
  let dts = 'export type CommandHandlers = {\n'
  for (const cmd of commands) {
    dts += `  /** name '${cmd.name}' *\/\n`
    dts += `  '${cmd.id}': (interaction: APIInteraction, options: {}) => any\n`
  }
  dts += '}\n'

  console.log(dts)
})
