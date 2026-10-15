import {confirm, input, password} from '@inquirer/prompts'
import {readDiscordConfig, readDiscordSecrets, writeDiscordSecret} from './config.ts'

export type CredentialPrompts = {
  input?: (message: string) => Promise<string>
  password: (message: string) => Promise<string>
  confirmSave: (message: string) => Promise<boolean>
}

const defaultPrompts: CredentialPrompts = {
  input: (message) =>
    input({
      message,
      validate: (value) => value.trim().length > 0 || 'Client ID cannot be empty',
    }),
  password: (message) =>
    password({
      message,
      mask: '*',
      validate: (value) => value.trim().length > 0 || 'Secret cannot be empty',
    }),
  confirmSave: (message) => confirm({message, default: true}),
}

export async function resolveFirstUseCredentials(
  env: NodeJS.ProcessEnv,
  prompts: CredentialPrompts = defaultPrompts,
): Promise<{clientId: string; clientSecret: string; save: boolean}> {
  let clientId = env.CLIENT_ID?.trim()
  let clientSecret = env.CLIENT_SECRET?.trim()
  const missing = [
    ...(!clientId ? ['CLIENT_ID'] : []),
    ...(!clientSecret ? ['CLIENT_SECRET'] : []),
  ]

  if (missing.length) {
    console.log(`${missing.join('/')} not found in .env`)
    if (!clientId) {
      const promptedId = prompts.input
        ? prompts.input('Enter CLIENT_ID')
        : input({
          message: 'Enter CLIENT_ID',
          validate: (value) => value.trim().length > 0 || 'Client ID cannot be empty',
        })
      clientId = (await promptedId).trim()
    }
    if (!clientSecret) clientSecret = (await prompts.password('Enter CLIENT_SECRET')).trim()
    if (!clientId || !clientSecret) throw new Error('CLIENT_ID and CLIENT_SECRET cannot be empty')
    const save = await prompts.confirmSave(
      'Save the application in .discord.json and the secret in .discord.secret.json?',
    )
    return {clientId, clientSecret, save}
  }

  if (!clientId || !clientSecret) throw new Error('CLIENT_ID and CLIENT_SECRET cannot be empty')
  return {clientId, clientSecret, save: false}
}

export async function resolveClientSecret(
  clientId: string,
  env: NodeJS.ProcessEnv = process.env,
  options: {
    cwd?: string
    prompts?: CredentialPrompts
    preferSavedSecret?: boolean
  } = {},
): Promise<string> {
  const envSecret = env.CLIENT_SECRET?.trim()
  const envClientId = env.CLIENT_ID?.trim()
  if (envSecret && envClientId === clientId) return envSecret
  if (envSecret && !envClientId && !options.preferSavedSecret) return envSecret

  const cwd = options.cwd ?? process.cwd()
  await readDiscordConfig(cwd)
  const savedSecret = (await readDiscordSecrets(cwd)).secrets[clientId]?.trim()
  if (savedSecret) return savedSecret
  if (envSecret && !envClientId) return envSecret

  const prompts = options.prompts ?? defaultPrompts
  const clientSecret = (await prompts.password(`Client secret for ${clientId}`)).trim()
  if (!clientSecret) throw new Error(`Client secret for ${clientId} cannot be empty`)

  if (await prompts.confirmSave(`Save the client secret for ${clientId} in .discord.secret.json?`)) {
    await writeDiscordSecret(clientId, clientSecret, cwd)
  }
  return clientSecret
}
