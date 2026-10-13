import {open, readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {z} from 'zod'
import {
  DISCORD_CONFIG_PATH,
  DISCORD_CONFIG_SCHEMA_URL,
  type DiscordApplicationConfig,
  type DiscordConfig,
  discordConfigSchema,
} from '../scripts/discord-config-schema.ts'

export {DISCORD_CONFIG_PATH, DISCORD_CONFIG_SCHEMA_URL}
export type {DiscordApplicationConfig, DiscordConfig}

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

  if (options.schemaPath) {
    const env = options.env ?? process.env
    const clientId = env.CLIENT_ID?.trim()
    const clientSecret = env.CLIENT_SECRET?.trim()
    const publicKey = env.CLIENT_PUBLIC_KEY?.trim()
    applications.push({
      schema: options.schemaPath,
      ...(clientId && publicKey
        ? {
          clientId,
          publicKey,
          ...(clientSecret ? {clientSecret} : {}),
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

  try {
    const file = await open(filePath, 'wx')
    try {
      await file.writeFile(content, 'utf8')
    } finally {
      await file.close()
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') {
      console.log(`${DISCORD_CONFIG_PATH} already exists; leaving it unchanged`)
      return false
    }
    throw error
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

  const result = discordConfigSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`Invalid ${DISCORD_CONFIG_PATH}:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
