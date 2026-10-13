import assert from 'node:assert/strict'
import {test} from 'node:test'
import {type CliDependencies, listApplicationCommands, showApplicationInfo} from './discord.ts'

const env = {
  CLIENT_ID: '1234567890',
  CLIENT_SECRET: 'client-secret',
  CLIENT_PUBLIC_KEY: 'aabbcc',
}

const createDependencies = (): CliDependencies & {calls: string[]} => {
  const calls: string[] = []
  const dependencies: CliDependencies = {
    getToken: async (clientId, clientSecret) => {
      calls.push(`token:${clientId}:${clientSecret}`)
      return {access_token: 'access-token'}
    },
    discordApi: {
      getAuthorization: async (accessToken) => {
        calls.push(`me:${accessToken}`)
        return {
          data: {
            application: {
              id: env.CLIENT_ID,
              name: 'Example app',
              description: 'Test application',
              verify_key: 'AABBCC',
            },
            scopes: ['identify', 'applications.commands.update'],
            expires: '2026-10-12T12:00:00.000Z',
          },
        }
      },
      listGlobalCommands: async (accessToken, clientId) => {
        calls.push(`global:${accessToken}:${clientId}`)
        return {data: []}
      },
      listGuildCommands: async (accessToken, clientId, guildId) => {
        calls.push(`guild:${accessToken}:${clientId}:${guildId}`)
        return {data: []}
      },
      createCommand: async (_accessToken, _clientId, body) => {
        calls.push(`create:${body.name}`)
        return {data: {}}
      },
      updateCommand: async (_accessToken, _clientId, commandId, body) => {
        calls.push(`update:${commandId}:${body.name}`)
        return {data: {}}
      },
      bulkSetCommands: async (_accessToken, _clientId, body) => {
        calls.push(`bulk:${body?.length ?? 0}`)
        return {data: []}
      },
    },
  }
  return Object.assign(dependencies, {calls})
}

test('me verifies application identity and public key using the OAuth API', async () => {
  const dependencies = createDependencies()
  await showApplicationInfo(env, dependencies)

  assert.deepEqual(dependencies.calls, [
    `token:${env.CLIENT_ID}:${env.CLIENT_SECRET}`,
    'me:access-token',
  ])
})

test('me rejects a public key that does not match Discord', async () => {
  const dependencies = createDependencies()
  dependencies.discordApi.getAuthorization = async () => ({
    data: {
      application: {
        id: env.CLIENT_ID,
        name: 'Example app',
        description: '',
        verify_key: 'ddeeff',
      },
      scopes: [],
      expires: '',
    },
  })

  await assert.rejects(showApplicationInfo(env, dependencies), /CLIENT_PUBLIC_KEY does not match/)
})

test('list requests registered global or guild commands from the Discord SDK', async () => {
  const dependencies = createDependencies()
  await listApplicationCommands(env, undefined, dependencies)
  await listApplicationCommands(env, '9876543210', dependencies)

  assert.ok(dependencies.calls.includes(`global:access-token:${env.CLIENT_ID}`))
  assert.ok(dependencies.calls.includes(`guild:access-token:${env.CLIENT_ID}:9876543210`))
})
