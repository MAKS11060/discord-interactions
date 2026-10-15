import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import type {ApplicationCommandCreateRequest} from '../src/lib/api/discord/index.ts'
import type {DiscordApplicationConfig} from './config.ts'
import {resolveClientSecret} from './credentials.ts'
import {type CliDependencies, createCliDependencies} from './discord.ts'

export type CommandPayload = ApplicationCommandCreateRequest

export async function loadCommandsFromSchema(
  schemaPath: string,
  cwd = process.cwd(),
): Promise<CommandPayload[]> {
  const url = pathToFileURL(resolve(cwd, schemaPath))
  url.searchParams.set('reload', String(Date.now()))
  const module = await import(url.href) as Record<string, unknown>
  const schema = module.schema ?? module.default ?? module.commands

  let commands: unknown
  if (Array.isArray(schema)) {
    commands = schema
  } else if (isRecord(schema) && typeof schema.toJSON === 'function') {
    commands = schema.toJSON()
  } else {
    throw new TypeError(`Schema module "${schemaPath}" must export an array or an object with toJSON()`)
  }

  if (!Array.isArray(commands) || !commands.every(isCommandPayload)) {
    throw new TypeError(`Schema module "${schemaPath}" did not produce valid application commands`)
  }
  if (commands.length === 0) throw new Error(`No commands found in schema "${schemaPath}"`)
  return commands
}

export async function pushApplicationCommands(
  application: DiscordApplicationConfig,
  env: NodeJS.ProcessEnv,
  options: {
    schemaPath?: string
    names?: string[]
    all?: boolean
    cwd?: string
    dependencies?: CliDependencies
    resolveSecret?: (clientId: string, env: NodeJS.ProcessEnv, cwd: string) => Promise<string>
  } = {},
): Promise<void> {
  const schemaPath = options.schemaPath ?? application.schema
  if (!schemaPath) throw new Error('No schema path configured; use --schema <path>')

  const clientId = application.clientId?.trim() || env.CLIENT_ID?.trim()
  if (!clientId) throw new Error(`Missing clientId for schema "${schemaPath}"`)
  const cwd = options.cwd ?? process.cwd()
  const clientSecret = options.resolveSecret
    ? await options.resolveSecret(clientId, env, cwd)
    : await resolveClientSecret(clientId, env, {cwd, preferSavedSecret: true})

  const commands = await loadCommandsFromSchema(schemaPath, cwd)
  const names = options.names
  let selected: CommandPayload[]
  if (options.all) {
    selected = commands
  } else if (names?.length) {
    const notFound = names.filter((name) => !commands.some((command) => command.name === name))
    if (notFound.length) {
      throw new Error(
        `Command${notFound.length === 1 ? '' : 's'} not found in schema: ${notFound.join(', ')}`,
      )
    }
    selected = commands.filter((command) => names.includes(command.name))
  } else {
    throw new Error('Select --all or at least one command name')
  }

  const dependencies = options.dependencies ?? createCliDependencies()
  const token = await dependencies.getToken(clientId, clientSecret)

  if (options.all) {
    const result = await dependencies.discordApi.bulkSetCommands(token.access_token, clientId, selected)
    assertApiSuccess(result.error)
    console.log(`Synchronized ${selected.length} application command(s) for ${clientId}`)
    return
  }

  const existingResult = await dependencies.discordApi.listGlobalCommands(token.access_token, clientId)
  assertApiSuccess(existingResult.error)
  const existingCommands = existingResult.data ?? []

  for (const command of selected) {
    const existing = existingCommands.find((registered) =>
      registered.name === command.name && (registered.type ?? 1) === (command.type ?? 1)
    )
    if (existing) {
      const result = await dependencies.discordApi.updateCommand(
        token.access_token,
        clientId,
        existing.id,
        command,
      )
      assertApiSuccess(result.error)
      console.log(`Updated ${command.name} for ${clientId}`)
    } else {
      const result = await dependencies.discordApi.createCommand(token.access_token, clientId, command)
      assertApiSuccess(result.error)
      console.log(`Created ${command.name} for ${clientId}`)
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCommandPayload(value: unknown): value is CommandPayload {
  return isRecord(value) && typeof value.name === 'string' && value.name.length > 0
}

function assertApiSuccess(error: unknown): void {
  if (error === undefined) return
  const detail = error instanceof Error
    ? error.message
    : isRecord(error) && typeof error.message === 'string'
    ? error.message
    : String(error)
  throw new Error(`Discord API request failed: ${detail}`)
}
