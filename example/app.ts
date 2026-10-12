import {DiscordInteraction, importPublicKey} from '#app'
import {getEnvRequired} from '#env'
import {schema} from './builder.ts'

// load schema
import './commands/activity.ts'
import './commands/message.ts'
import './commands/slash.ts'
import './commands/user.ts'

export const app = new DiscordInteraction({
  publicKey: await importPublicKey(getEnvRequired('CLIENT_PUBLIC_KEY')),
  schema,
})
