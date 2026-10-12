import {createDiscordOauth2, oauth2ClientCredentials, type OAuth2TokenResponse} from '@maks11060/oauth2'
import {printSchema} from '../src/helper.ts'
import * as discordRest from '../src/lib/api/discord/index.ts'

type Authorization = {
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

export type DiscordApi = {
  getAuthorization: (accessToken: string) => Promise<{data?: Authorization; error?: unknown}>
  listGlobalCommands: (accessToken: string, clientId: string) => Promise<{data?: CommandList; error?: unknown}>
  listGuildCommands: (
    accessToken: string,
    clientId: string,
    guildId: string,
  ) => Promise<{data?: CommandList; error?: unknown}>
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

const createDependencies = (): CliDependencies => {
  let token: OAuth2TokenResponse | undefined
  return {
    getToken: async (clientId, clientSecret) => {
      token ??= await oauth2ClientCredentials(createDiscordOauth2({
        clientId,
        clientSecret,
        scope: ['identify', 'applications.commands.update'],
        redirectUri: '',
      }))
      return token
    },
    discordApi,
  }
}

const getCredentials = (env: NodeJS.ProcessEnv) => ({
  clientId: getRequiredEnv(env, 'CLIENT_ID'),
  clientSecret: getRequiredEnv(env, 'CLIENT_SECRET'),
})

export const showApplicationInfo = async (
  env: NodeJS.ProcessEnv = process.env,
  dependencies: CliDependencies = createDependencies(),
): Promise<void> => {
  const {clientId, clientSecret} = getCredentials(env)
  const publicKey = getRequiredEnv(env, 'CLIENT_PUBLIC_KEY')
  const token = await dependencies.getToken(clientId, clientSecret)
  const {data, error} = await dependencies.discordApi.getAuthorization(token.access_token)
  assertApiSuccess(error)
  if (!data) throw new Error('Discord API did not return application information')

  const application = data.application
  if (application.id !== clientId) {
    throw new Error(`CLIENT_ID mismatch: .env has ${clientId}, Discord returned ${application.id}`)
  }
  if (application.verify_key.toLowerCase() !== publicKey.toLowerCase()) {
    throw new Error('CLIENT_PUBLIC_KEY does not match the public key returned by Discord')
  }

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
  console.log('CLIENT_PUBLIC_KEY: matches Discord')
}

export const listApplicationCommands = async (
  env: NodeJS.ProcessEnv = process.env,
  guildId?: string,
  dependencies: CliDependencies = createDependencies(),
): Promise<void> => {
  const {clientId, clientSecret} = getCredentials(env)
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
