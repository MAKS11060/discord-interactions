import {discordInteractions} from '#app'
import {importPublicKey} from '#lib/crypto.ts'
import * as example1 from './app/mod.ts'
import {serve} from './serve.ts'

// --- USER API ---
const CLIENT_PUBLIC_KEY = process.env['CLIENT_PUBLIC_KEY']!
const publicKey = await importPublicKey(CLIENT_PUBLIC_KEY)

export const app1 = discordInteractions({
  publicKey,
  schema: {
    ...example1,
  },
})

const handler = async (req: Request): Promise<Response> => {
  // return interactionHandler(req, app1)
  console.log(req)
}

serve((req) => {
  return Response.json({t: Date.now()})
})
