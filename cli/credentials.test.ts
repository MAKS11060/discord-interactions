import assert from 'node:assert/strict'
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'
import {DISCORD_SECRET_SCHEMA_URL, readDiscordSecrets, writeDiscordSecret} from './config.ts'
import {resolveClientSecret, resolveFirstUseCredentials} from './credentials.ts'

async function withTempDirectory(run: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'discord-interactions-credentials-'))
  try {
    await run(directory)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
}

test('secret resolution prefers env, then the secret file', async () => {
  await withTempDirectory(async (cwd) => {
    await writeDiscordSecret('app-123', 'stored-secret', cwd)
    const envSecret = await resolveClientSecret(
      'app-123',
      {CLIENT_SECRET: ' env-secret '},
      {cwd},
    )
    const storedSecret = await resolveClientSecret('app-123', {}, {cwd})

    assert.equal(envSecret, 'env-secret')
    assert.equal(storedSecret, 'stored-secret')
  })
})

test('a configured application prefers its own saved secret over an unscoped env secret', async () => {
  await withTempDirectory(async (cwd) => {
    await writeDiscordSecret('app-123', 'stored-secret', cwd)
    const secret = await resolveClientSecret(
      'app-123',
      {CLIENT_SECRET: 'unscoped-secret'},
      {cwd, preferSavedSecret: true},
    )

    assert.equal(secret, 'stored-secret')
  })
})

test('missing secrets are prompted and optionally saved by client id', async () => {
  await withTempDirectory(async (cwd) => {
    let prompted = false
    const secret = await resolveClientSecret('app-123', {}, {
      cwd,
      prompts: {
        password: async () => {
          prompted = true
          return 'prompted-secret'
        },
        confirmSave: async () => true,
      },
    })

    assert.equal(prompted, true)
    assert.equal(secret, 'prompted-secret')
    assert.deepEqual(await readDiscordSecrets(cwd), {
      $schema: DISCORD_SECRET_SCHEMA_URL,
      secrets: {'app-123': 'prompted-secret'},
    })
    assert.match(await readFile(join(cwd, '.gitignore'), 'utf8'), /\.discord\.secret\.json/)
  })
})

test('prompted secrets are not saved when declined', async () => {
  await withTempDirectory(async (cwd) => {
    await writeFile(join(cwd, '.gitignore'), 'node_modules\n')
    const secret = await resolveClientSecret('app-123', {}, {
      cwd,
      prompts: {
        password: async () => 'temporary-secret',
        confirmSave: async () => false,
      },
    })

    assert.equal(secret, 'temporary-secret')
    assert.deepEqual(await readDiscordSecrets(cwd), {
      $schema: DISCORD_SECRET_SCHEMA_URL,
      secrets: {},
    })
    assert.equal(await readFile(join(cwd, '.gitignore'), 'utf8'), 'node_modules\n')
  })
})

test('first-use credentials prompt for missing environment values and ask before saving', async () => {
  const prompted: string[] = []
  const credentials = await resolveFirstUseCredentials({}, {
    input: async (message) => {
      prompted.push(message)
      return 'app-123'
    },
    password: async (message) => {
      prompted.push(message)
      return 'client-secret'
    },
    confirmSave: async (message) => {
      prompted.push(message)
      return true
    },
  })

  assert.deepEqual(credentials, {
    clientId: 'app-123',
    clientSecret: 'client-secret',
    save: true,
  })
  assert.deepEqual(prompted, [
    'Enter CLIENT_ID',
    'Enter CLIENT_SECRET',
    'Save the application in .discord.json and the secret in .discord.secret.json?',
  ])
})
