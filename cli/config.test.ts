import assert from 'node:assert/strict'
import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {discordConfigJsonSchema, writeDiscordConfigJsonSchema} from '../scripts/generate-discord-schema.ts'
import {DISCORD_CONFIG_SCHEMA_URL, initDiscordConfig, readDiscordConfig} from './config.ts'

async function withTempDirectory(run: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'discord-interactions-cli-'))
  try {
    await run(directory)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

test('init creates a validated Discord config and seeds schema and credentials', async () => {
  await withTempDirectory(async (cwd) => {
    const created = await initDiscordConfig({
      cwd,
      schemaPath: './example/schema.ts',
      env: {
        CLIENT_ID: ' app-123 ',
        CLIENT_SECRET: ' secret ',
        CLIENT_PUBLIC_KEY: ' key ',
      },
    })
    const config = await readDiscordConfig(cwd)

    assert.equal(created, true)
    assert.deepEqual(config, {
      $schema: DISCORD_CONFIG_SCHEMA_URL,
      applications: [{
        schema: './example/schema.ts',
        clientId: 'app-123',
        clientSecret: 'secret',
        publicKey: 'key',
      }],
    })
  })
})

test('init does not overwrite an existing config', async () => {
  await withTempDirectory(async (cwd) => {
    await initDiscordConfig({cwd})
    const before = await readFile(join(cwd, '.discord.json'), 'utf8')
    const createdAgain = await initDiscordConfig({cwd, schemaPath: './another-schema.ts'})
    const after = await readFile(join(cwd, '.discord.json'), 'utf8')

    assert.equal(createdAgain, false)
    assert.equal(after, before)
  })
})

test('the script-generated JSON schema stays aligned with Zod config validation', async () => {
  await withTempDirectory(async (cwd) => {
    await initDiscordConfig({cwd})
    const schemaPath = join(cwd, 'discord.schema.json')
    await writeDiscordConfigJsonSchema(schemaPath)
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
    assert.deepEqual(schema, discordConfigJsonSchema)
    assert.deepEqual(await readDiscordConfig(cwd), {
      $schema: DISCORD_CONFIG_SCHEMA_URL,
      applications: [],
    })

    await writeFile(
      join(cwd, '.discord.json'),
      JSON.stringify({
        $schema: DISCORD_CONFIG_SCHEMA_URL,
        applications: [{schema: ''}],
      }),
    )
    await assert.rejects(readDiscordConfig(cwd), /Invalid \.discord\.json/)
  })
})
