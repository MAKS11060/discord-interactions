import {DiscordInteraction, importPublicKey} from '#app'
import {getEnvRequired} from '#env'
import {schema} from './schema.ts'

export const app = new DiscordInteraction({
  publicKey: await importPublicKey(getEnvRequired('CLIENT_PUBLIC_KEY')),
  schema,
})
