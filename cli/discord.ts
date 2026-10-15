import {createDiscordOauth2, oauth2ClientCredentials, type OAuth2TokenResponse} from '@maks11060/oauth2'
import * as discordRest from '../src/lib/api/discord/index.ts'
import type {DiscordApplicationConfig} from './config.ts'
import {type CredentialPrompts, resolveClientSecret} from './credentials.ts'
import {printSchema} from './helper.ts'

export type Authorization = {
  application: {
    id: string
    name: string
    description: string
    verify_key: string
  }
  expires: string
  scopes: string[]
  user?: {id: string; username: string}
}

type CommandList = Awaited<ReturnType<typeof discordRest.listApplicationCommands>>['data']
type CreateCommandBody = Parameters<typeof discordRest.createApplicationCommand>[0]['body']
type UpdateCommandBody = Parameters<typeof discordRest.updateApplicationCommand>[0]['body']
type BulkSetCommandBody = Parameters<typeof discordRest.bulkSetApplicationCommands>[0]['body']

export type DiscordApi = {
  getAuthorization: (accessToken: string) => Promise<{data?: Authorization; error?: unknown}>
  listGlobalCommands: (accessToken: string, clientId: string) => Promise<{data?: CommandList; error?: unknown}>
  listGuildCommands: (
    accessToken: string,
    clientId: string,
    guildId: string,
  ) => Promise<{data?: CommandList; error?: unknown}>
  createCommand: (
    accessToken: string,
    clientId: string,
    body: CreateCommandBody,
  ) => Promise<{data?: unknown; error?: unknown}>
  updateCommand: (
    accessToken: string,
    clientId: string,
    commandId: string,
    body: UpdateCommandBody,
  ) => Promise<{data?: unknown; error?: unknown}>
  bulkSetCommands: (
    accessToken: string,
    clientId: string,
    body: BulkSetCommandBody,
  ) => Promise<{data?: unknown; error?: unknown}>
}

export type CliDependencies = {
  getToken: (clientId: string, clientSecret: string) => Promise<Pick<OAuth2TokenResponse, 'access_token'>>
  discordApi: DiscordApi
}

const discordApi: DiscordApi = {
  getAuthorization: (accessToken) => discordRest.getMyOauth2Authorization({auth: accessToken}),
  listGlobalCommands: (accessToken, clientId) =>
    discordRest.listApplicationCommands({
      auth: accessToken,
      path: {application_id: clientId},
    }),
  listGuildCommands: (accessToken, clientId, guildId) =>
    discordRest.listGuildApplicationCommands({
      auth: accessToken,
      path: {application_id: clientId, guild_id: guildId},
    }),
  createCommand: (accessToken, clientId, body) =>
    discordRest.createApplicationCommand({
      auth: accessToken,
      path: {application_id: clientId},
      body,
    }),
  updateCommand: (accessToken, clientId, commandId, body) =>
    discordRest.updateApplicationCommand({
      auth: accessToken,
      path: {application_id: clientId, command_id: commandId},
      body,
    }),
  bulkSetCommands: (accessToken, clientId, body) =>
    discordRest.bulkSetApplicationCommands({
      auth: accessToken,
      path: {application_id: clientId},
      body,
    }),
}

const getRequiredEnv = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return 'Unknown Discord API error'
}

const assertApiSuccess = (error: unknown): void => {
  if (error !== undefined) throw new Error(`Discord API request failed: ${getApiErrorMessage(error)}`)
}

export const createCliDependencies = (): CliDependencies => {
  const tokens = new Map<string, OAuth2TokenResponse>()
  return {
    getToken: async (clientId, clientSecret) => {
      const key = `${clientId}:${clientSecret}`
      let token = tokens.get(key)
      if (!token) {
        token = await oauth2ClientCredentials(createDiscordOauth2({
          clientId,
          clientSecret,
          scope: ['identify', 'applications.commands.update'],
          redirectUri: '',
        }))
        tokens.set(key, token)
      }
      return token
    },
    discordApi,
  }
}

const getCredentials = async (
  env: NodeJS.ProcessEnv,
  options: {cwd?: string; prompts?: CredentialPrompts; application?: DiscordApplicationConfig} = {},
) => {
  const clientId = options.application?.clientId?.trim() || getRequiredEnv(env, 'CLIENT_ID')
  const clientSecret = await resolveClientSecret(clientId, env, {
    ...options,
    preferSavedSecret: Boolean(options.application),
  })
  return {clientId, clientSecret}
}

export async function getAuthorizedApplication(
  clientId: string,
  clientSecret: string,
  dependencies: CliDependencies = createCliDependencies(),
): Promise<Authorization['application']> {
  const token = await dependencies.getToken(clientId, clientSecret)
  const {data, error} = await dependencies.discordApi.getAuthorization(token.access_token)
  assertApiSuccess(error)
  if (!data) throw new Error('Discord API did not return application information')
  if (data.application.id !== clientId) {
    throw new Error(`CLIENT_ID mismatch: expected ${clientId}, Discord returned ${data.application.id}`)
  }
  return data.application
}

export const showApplicationInfo = async (
  env: NodeJS.ProcessEnv = process.env,
  dependencies: CliDependencies = createCliDependencies(),
  options: {cwd?: string; prompts?: CredentialPrompts; application?: DiscordApplicationConfig} = {},
): Promise<void> => {
  const {clientId, clientSecret} = await getCredentials(env, options)
  const token = await dependencies.getToken(clientId, clientSecret)
  const {data, error} = await dependencies.discordApi.getAuthorization(token.access_token)
  assertApiSuccess(error)
  if (!data) throw new Error('Discord API did not return application information')

  const application = data.application
  if (application.id !== clientId) {
    throw new Error(`CLIENT_ID mismatch: .env has ${clientId}, Discord returned ${application.id}`)
  }
  const envPublicKey = env.CLIENT_ID?.trim() === clientId ? env.CLIENT_PUBLIC_KEY?.trim() : undefined
  const publicKey = options.application?.publicKey?.trim() || envPublicKey

  console.log({
    user: data.user
      ? {
        id: data.user.id,
        username: data.user.username,
      }
      : undefined,
    application,
    scopes: data.scopes,
    expires: data.expires,
  })
  if (publicKey?.toLowerCase() !== application.verify_key.toLowerCase()) {
    throw new Error(`Mismatched PUBLIC_KEY: \n     Local ${publicKey}\n    Remote ${application.verify_key}`)
  }
}

export const listApplicationCommands = async (
  env: NodeJS.ProcessEnv = process.env,
  guildId?: string,
  dependencies: CliDependencies = createCliDependencies(),
  options: {cwd?: string; prompts?: CredentialPrompts; application?: DiscordApplicationConfig} = {},
): Promise<void> => {
  const {clientId, clientSecret} = await getCredentials(env, options)
  const token = await dependencies.getToken(clientId, clientSecret)
  const result = guildId
    ? await dependencies.discordApi.listGuildCommands(token.access_token, clientId, guildId)
    : await dependencies.discordApi.listGlobalCommands(token.access_token, clientId)
  assertApiSuccess(result.error)
  if (!result.data) {
    console.log('No registered application commands')
    return
  }
  if (!printSchema(result.data, {showOptions: true})) console.log('No registered application commands')
}
