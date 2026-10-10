import {DiscordInteraction, importPublicKey} from '#app'
import {getEnvRequired} from '#env'
import {schema} from './builder.ts'

import './schema.ts' // load schema

export const app = new DiscordInteraction({
  publicKey: await importPublicKey(getEnvRequired('CLIENT_PUBLIC_KEY')),
  schema,
})
