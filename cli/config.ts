import {appendFile, open, readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {z} from 'zod'
import {
  DISCORD_CONFIG_PATH,
  DISCORD_CONFIG_SCHEMA_URL,
  DISCORD_SECRET_PATH,
  DISCORD_SECRET_SCHEMA_URL,
  type DiscordApplicationConfig,
  type DiscordConfig,
  discordConfigSchema,
  type DiscordSecretConfig,
  discordSecretConfigSchema,
} from '../scripts/discord-config-schema.ts'

export {DISCORD_CONFIG_PATH, DISCORD_CONFIG_SCHEMA_URL, DISCORD_SECRET_PATH, DISCORD_SECRET_SCHEMA_URL}
export type {DiscordApplicationConfig, DiscordConfig, DiscordSecretConfig}

export async function initDiscordConfig(
  options: {
    cwd?: string
    schemaPath?: string
    env?: NodeJS.ProcessEnv
  } = {},
): Promise<boolean> {
  const cwd = options.cwd ?? process.cwd()
  const filePath = resolve(cwd, DISCORD_CONFIG_PATH)
  const applications: DiscordApplicationConfig[] = []
  const env = options.env ?? process.env
  const clientId = env.CLIENT_ID?.trim()
  const clientSecret = env.CLIENT_SECRET?.trim()

  if (options.schemaPath) {
    const publicKey = env.CLIENT_PUBLIC_KEY?.trim()
    applications.push({
      schema: options.schemaPath,
      ...(clientId && publicKey
        ? {
          clientId,
          publicKey,
        }
        : {}),
    })
  }

  const content = `${
    JSON.stringify(
      {
        $schema: DISCORD_CONFIG_SCHEMA_URL,
        applications,
      },
      null,
      2,
    )
  }\n`

  await ensureGitIgnoreEntry(cwd, DISCORD_SECRET_PATH)
  await initializeSecretFile(cwd)
  if (clientId && clientSecret) await writeDiscordSecret(clientId, clientSecret, cwd)

  const created = await writeFileExclusive(filePath, content)
  if (!created) {
    console.log(`${DISCORD_CONFIG_PATH} already exists; leaving it unchanged`)
    return false
  }

  console.log(`Created ${DISCORD_CONFIG_PATH}`)
  return true
}

export async function readDiscordConfig(
  cwd = process.cwd(),
): Promise<DiscordConfig | undefined> {
  let content: string
  try {
    content = await readFile(resolve(cwd, DISCORD_CONFIG_PATH), 'utf8')
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return undefined
    throw error
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(`Invalid JSON in ${DISCORD_CONFIG_PATH}`, {cause: error})
  }

  const legacyConfig = parseLegacyConfig(parsed)
  const result = discordConfigSchema.safeParse(legacyConfig.config)
  if (!result.success) {
    throw new Error(`Invalid ${DISCORD_CONFIG_PATH}:\n${z.prettifyError(result.error)}`)
  }
  if (legacyConfig.secrets.size > 0) {
    await migrateLegacySecrets(cwd, legacyConfig.secrets)
    await writeFile(resolve(cwd, DISCORD_CONFIG_PATH), `${JSON.stringify(result.data, null, 2)}\n`, 'utf8')
    console.log(`Moved clientSecret values from ${DISCORD_CONFIG_PATH} to ${DISCORD_SECRET_PATH}`)
  }
  return result.data
}

export async function readDiscordSecrets(cwd = process.cwd()): Promise<DiscordSecretConfig> {
  let content: string
  try {
    content = await readFile(resolve(cwd, DISCORD_SECRET_PATH), 'utf8')
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {$schema: DISCORD_SECRET_SCHEMA_URL, secrets: {}}
    }
    throw error
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(`Invalid JSON in ${DISCORD_SECRET_PATH}`, {cause: error})
  }

  const result = discordSecretConfigSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid ${DISCORD_SECRET_PATH}:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export async function writeDiscordSecret(
  clientId: string,
  clientSecret: string,
  cwd = process.cwd(),
): Promise<void> {
  const secretConfig = await readDiscordSecrets(cwd)
  secretConfig.secrets[clientId] = clientSecret
  await ensureGitIgnoreEntry(cwd, DISCORD_SECRET_PATH)
  await writeFile(
    resolve(cwd, DISCORD_SECRET_PATH),
    `${JSON.stringify(secretConfig, null, 2)}\n`,
    'utf8',
  )
}

export async function writeDiscordApplication(
  application: DiscordApplicationConfig & {clientId: string},
  clientSecret: string,
  cwd = process.cwd(),
): Promise<void> {
  const config = await readDiscordConfig(cwd) ?? {
    $schema: DISCORD_CONFIG_SCHEMA_URL,
    applications: [],
  }
  const existingIndex = config.applications.findIndex((item) => item.clientId === application.clientId)
  if (existingIndex === -1) {
    config.applications.push(application)
  } else {
    config.applications[existingIndex] = {...config.applications[existingIndex], ...application}
  }
  await writeFile(
    resolve(cwd, DISCORD_CONFIG_PATH),
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8',
  )
  await writeDiscordSecret(application.clientId, clientSecret, cwd)
}

async function initializeSecretFile(cwd: string): Promise<void> {
  const filePath = resolve(cwd, DISCORD_SECRET_PATH)
  const content = `${JSON.stringify({$schema: DISCORD_SECRET_SCHEMA_URL, secrets: {}}, null, 2)}\n`
  const created = await writeFileExclusive(filePath, content)
  if (created) console.log(`Created ${DISCORD_SECRET_PATH}`)
}

async function ensureGitIgnoreEntry(cwd: string, entry: string): Promise<void> {
  const filePath = resolve(cwd, '.gitignore')
  let content: string
  try {
    content = await readFile(filePath, 'utf8')
  } catch (error) {
    if (!isNodeError(error) || error.code !== 'ENOENT') throw error
    content = ''
  }
  if (content.split(/\r?\n/).some((line) => line.trim() === entry)) return
  const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : ''
  await appendFile(filePath, `${separator}${entry}\n`, 'utf8')
}

async function writeFileExclusive(path: string, content: string): Promise<boolean> {
  try {
    const file = await open(path, 'wx')
    try {
      await file.writeFile(content, 'utf8')
    } finally {
      await file.close()
    }
    return true
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') return false
    throw error
  }
}

function parseLegacyConfig(parsed: unknown): {config: unknown; secrets: Map<string, string>} {
  if (
    typeof parsed !== 'object'
    || parsed === null
    || !('applications' in parsed)
    || !Array.isArray(parsed.applications)
  ) {
    return {config: parsed, secrets: new Map()}
  }

  const secrets = new Map<string, string>()
  const applications = parsed.applications.map((application) => {
    if (
      typeof application !== 'object'
      || application === null
      || !('clientSecret' in application)
    ) return application
    if (typeof application.clientSecret !== 'string' || !application.clientSecret.trim()) return application
    if (typeof application.clientId !== 'string' || !application.clientId.trim()) return application
    secrets.set(application.clientId.trim(), application.clientSecret.trim())
    const {clientSecret: _clientSecret, ...publicApplication} = application
    return publicApplication
  })
  return {config: {...parsed, applications}, secrets}
}

async function migrateLegacySecrets(cwd: string, secrets: Map<string, string>): Promise<void> {
  const secretConfig = await readDiscordSecrets(cwd)
  for (const [clientId, clientSecret] of secrets) {
    secretConfig.secrets[clientId] ??= clientSecret
  }
  await ensureGitIgnoreEntry(cwd, DISCORD_SECRET_PATH)
  await writeFile(
    resolve(cwd, DISCORD_SECRET_PATH),
    `${JSON.stringify(secretConfig, null, 2)}\n`,
    'utf8',
  )
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
