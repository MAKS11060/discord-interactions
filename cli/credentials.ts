import {confirm, password} from '@inquirer/prompts'
import {readDiscordConfig, readDiscordSecrets, writeDiscordSecret} from './config.ts'

export type CredentialPrompts = {
  password: (message: string) => Promise<string>
  confirmSave: (message: string) => Promise<boolean>
}

const defaultPrompts: CredentialPrompts = {
  password: (message) =>
    password({
      message,
      mask: '*',
      validate: (value) => value.trim().length > 0 || 'Secret cannot be empty',
    }),
  confirmSave: (message) => confirm({message, default: true}),
}

export async function resolveClientSecret(
  clientId: string,
  env: NodeJS.ProcessEnv = process.env,
  options: {
    cwd?: string
    prompts?: CredentialPrompts
  } = {},
): Promise<string> {
  const envSecret = env.CLIENT_SECRET?.trim()
  if (envSecret) return envSecret

  const cwd = options.cwd ?? process.cwd()
  await readDiscordConfig(cwd)
  const savedSecret = (await readDiscordSecrets(cwd)).secrets[clientId]?.trim()
  if (savedSecret) return savedSecret

  const prompts = options.prompts ?? defaultPrompts
  const clientSecret = (await prompts.password(`Client secret for ${clientId}`)).trim()
  if (!clientSecret) throw new Error(`Client secret for ${clientId} cannot be empty`)

  if (await prompts.confirmSave(`Save the client secret for ${clientId} in .discord.secret.json?`)) {
    await writeDiscordSecret(clientId, clientSecret, cwd)
  }
  return clientSecret
}
