import {discordInteractions} from '#app'
import { importPublicKey } from '#lib/crypto.ts';
import * as example1 from './app/mod.ts'

// --- USER API ---
const CLIENT_PUBLIC_KEY = process.env['CLIENT_PUBLIC_KEY']!
const publicKey = await importPublicKey(CLIENT_PUBLIC_KEY)

export const app1 = discordInteractions({
  publicKey,
  schema: {
    ...example1,
  },
})

// --- INTERNAL ---
app1
