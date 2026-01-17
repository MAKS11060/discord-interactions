#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {verifyRequestSignature} from '#/lib/crypto.ts'
import {interaction} from '@maks11060/discord-interactions'
import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {createMiddleware} from 'hono/factory'
import {logger} from 'hono/logger'
import {publicKey} from './config.ts'

const verifyInteraction = (key: CryptoKey /* | Record<string, CryptoKey> */) => {
  return createMiddleware(async (c, next) => {
    const isInvalidRequest = await verifyRequestSignature(c.req.raw, key)
    if (isInvalidRequest) return isInvalidRequest
    await next() // ok
  })
}

const app = new Hono()
  .use(cors())
  .use(logger())
  .post('/discord/interactions', verifyInteraction(publicKey), async (c) => {
    return c.json(
      await interaction(
        await c.req.json(),
      ),
    )
  })

if (Deno.env.has('KEY') && Deno.env.has('CERT')) {
  const key = Deno.readTextFileSync(Deno.env.get('KEY')!)
  const cert = Deno.readTextFileSync(Deno.env.get('CERT')!)
  Deno.serve({port: 443, key, cert}, app.fetch)
} else {
  Deno.serve({port: 80}, app.fetch)
}
