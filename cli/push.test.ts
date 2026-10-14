import assert from 'node:assert/strict'
import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import type {ApplicationCommandResponse} from '../src/lib/api/discord/index.ts'
import type {CliDependencies} from './discord.ts'
import {loadCommandsFromSchema, pushApplicationCommands} from './push.ts'

async function withSchema(
  run: (directory: string, schemaPath: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'discord-interactions-push-'))
  const schemaPath = join(directory, 'schema.ts')
  try {
    await writeFile(
      schemaPath,
      `
      export const schema = {
        toJSON: () => [
          {name: 'existing', description: 'updated description', type: 1},
          {name: 'new-command', description: 'new command', type: 1},
        ],
      }
    `,
    )
    await run(directory, schemaPath)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

function createDependencies(existingCommands: ApplicationCommandResponse[] = []) {
  const calls: string[] = []
  const dependencies: CliDependencies = {
    getToken: async (clientId, clientSecret) => {
      calls.push(`token:${clientId}:${clientSecret}`)
      return {access_token: 'token'}
    },
    discordApi: {
      getAuthorization: async () => ({}),
      listGlobalCommands: async () => ({data: existingCommands}),
      listGuildCommands: async () => ({data: []}),
      createCommand: async (_token, _appId, body) => {
        calls.push(`create:${body.name}`)
        return {data: {}}
      },
      updateCommand: async (_token, _appId, commandId, body) => {
        calls.push(`update:${commandId}:${body.name}`)
        return {data: {}}
      },
      bulkSetCommands: async (_token, _appId, body) => {
        calls.push(`bulk:${body?.length}`)
        return {data: []}
      },
    },
  }
  return {dependencies, calls}
}

const application = {
  schema: './schema.ts',
  clientId: 'app-id',
  clientSecret: 'app-secret',
}

test('schema loader imports command JSON from an InteractionBuilder-like export', async () => {
  await withSchema(async (cwd, schemaPath) => {
    const commands = await loadCommandsFromSchema(schemaPath, cwd)
    assert.deepEqual(commands.map((command) => command.name), ['existing', 'new-command'])
  })
})

test('push --all bulk synchronizes the schema commands', async () => {
  await withSchema(async (cwd, schemaPath) => {
    const {dependencies, calls} = createDependencies()
    await pushApplicationCommands(application, {}, {
      all: true,
      schemaPath,
      cwd,
      dependencies,
    })
    assert.deepEqual(calls, ['token:app-id:app-secret', 'bulk:2'])
  })
})

test('push by name updates matching commands and creates missing commands', async () => {
  await withSchema(async (cwd, schemaPath) => {
    const {dependencies, calls} = createDependencies([{
      id: 'command-id',
      application_id: 'app-id',
      version: '1',
      default_member_permissions: null,
      type: 1,
      name: 'existing',
      description: 'old description',
    }])
    await pushApplicationCommands(application, {}, {
      names: ['existing', 'new-command'],
      schemaPath,
      cwd,
      dependencies,
    })
    assert.deepEqual(calls, [
      'token:app-id:app-secret',
      'update:command-id:existing',
      'create:new-command',
    ])
  })
})
