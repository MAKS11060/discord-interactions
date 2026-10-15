import assert from 'node:assert/strict'
import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {
  discordConfigJsonSchema,
  discordSecretJsonSchema,
  writeDiscordConfigJsonSchema,
  writeDiscordSecretJsonSchema,
} from '../scripts/generate-discord-schema.ts'
import {
  DISCORD_CONFIG_SCHEMA_URL,
  DISCORD_SECRET_SCHEMA_URL,
  initDiscordConfig,
  readDiscordConfig,
  readDiscordSecrets,
} from './config.ts'

async function withTempDirectory(run: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'discord-interactions-cli-'))
  try {
    await run(directory)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

test('init creates public and secret configs and ignores the secret file', async () => {
  await withTempDirectory(async (cwd) => {
    await writeFile(join(cwd, '.gitignore'), 'node_modules\n')
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
        publicKey: 'key',
      }],
    })
    assert.deepEqual(await readDiscordSecrets(cwd), {
      $schema: DISCORD_SECRET_SCHEMA_URL,
      secrets: {'app-123': 'secret'},
    })
    assert.equal(await readFile(join(cwd, '.gitignore'), 'utf8'), 'node_modules\n.discord.secret.json\n')
  })
})

test('init does not overwrite an existing config', async () => {
  await withTempDirectory(async (cwd) => {
    await initDiscordConfig({cwd})
    const before = await readFile(join(cwd, '.discord.json'), 'utf8')
    const secretBefore = await readFile(join(cwd, '.discord.secret.json'), 'utf8')
    const createdAgain = await initDiscordConfig({cwd, schemaPath: './another-schema.ts'})
    const after = await readFile(join(cwd, '.discord.json'), 'utf8')
    const secretAfter = await readFile(join(cwd, '.discord.secret.json'), 'utf8')

    assert.equal(createdAgain, false)
    assert.equal(after, before)
    assert.equal(secretAfter, secretBefore)
  })
})

test('the generated JSON schemas stay aligned with Zod validation', async () => {
  await withTempDirectory(async (cwd) => {
    await initDiscordConfig({cwd})
    const schemaPath = join(cwd, 'discord.schema.json')
    await writeDiscordConfigJsonSchema(schemaPath)
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
    assert.deepEqual(schema, discordConfigJsonSchema)
    const secretSchemaPath = join(cwd, 'discord-secret.schema.json')
    await writeDiscordSecretJsonSchema(secretSchemaPath)
    assert.deepEqual(
      JSON.parse(await readFile(secretSchemaPath, 'utf8')),
      discordSecretJsonSchema,
    )
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

test('legacy client secrets migrate into the ignored secret file', async () => {
  await withTempDirectory(async (cwd) => {
    await writeFile(
      join(cwd, '.discord.json'),
      JSON.stringify({
        $schema: DISCORD_CONFIG_SCHEMA_URL,
        applications: [{
          schema: './schema.ts',
          clientId: 'app-123',
          clientSecret: ' legacy-secret ',
        }],
      }),
    )

    assert.deepEqual(await readDiscordConfig(cwd), {
      $schema: DISCORD_CONFIG_SCHEMA_URL,
      applications: [{schema: './schema.ts', clientId: 'app-123'}],
    })
    assert.deepEqual(await readDiscordSecrets(cwd), {
      $schema: DISCORD_SECRET_SCHEMA_URL,
      secrets: {'app-123': 'legacy-secret'},
    })
    assert.match(await readFile(join(cwd, '.gitignore'), 'utf8'), /^\.discord\.secret\.json\n$/)
  })
})
