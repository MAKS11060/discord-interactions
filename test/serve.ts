#!/usr/bin/env -S deno run -A --env-file --watch-hmr

import {verifyRequestSignature} from '#/lib/crypto.ts'
import {interaction} from '@maks11060/discord-interactions'
import {concat} from '@std/bytes/concat'
import type {APIInteraction, APIInteractionResponse, APIPingInteraction} from 'discord-api-types/v10'
import {Hono} from 'hono'
import {createMiddleware} from 'hono/factory'
import {logger} from 'hono/logger'
import {publicKey} from './config.ts'

// const verifyInteraction = (key: CryptoKey /* | Record<string, CryptoKey> */) => {
//   return createMiddleware(async (c, next) => {
//     const isInvalidRequest = await verifyRequestSignature(c.req.raw, key)
//     if (isInvalidRequest) return isInvalidRequest
//     await next() // ok
//   })
// }

const interactionHono = (
  publicKey:
    | CryptoKey
    | Record<string, CryptoKey>
    | (({application_id}: APIPingInteraction) => Promise<CryptoKey>),
  handler: (interaction: APIInteraction) => Promise<APIInteractionResponse> | APIInteractionResponse,
) => {
  if (publicKey instanceof CryptoKey) {
    return createMiddleware(async (c, next) => {
      const isInvalidRequest = await verifyRequestSignature(c.req.raw, publicKey)
      if (isInvalidRequest) return isInvalidRequest
      // await next() // ok

      const data = await c.req.json<APIInteraction>()
      return c.json(await handler(data))
    })
  }

  if (typeof publicKey === 'function') {
    throw new Error('TODO')
    return createMiddleware(async (c, next) => {
    })
  }

  const encoder = new TextEncoder()
  return createMiddleware(async (c, next) => {
    const data = await c.req.json<APIInteraction>()

    // verify
    const signature = c.req.header('X-Signature-Ed25519')
    const timestamp = c.req.header('X-Signature-Timestamp')
    const body = new Uint8Array(await c.req.arrayBuffer())

    if (!signature || !timestamp) {
      return Response.json({error: 'Bad request signature'}, {status: 401})
    }

    if (!publicKey[data.application_id]) {
      return c.json({error: 'Public key missing for application id'}, 404)
    }

    const key = publicKey[data.application_id]
    const valid = await crypto.subtle.verify(
      key.algorithm,
      key,
      Uint8Array.fromHex(signature),
      concat([encoder.encode(timestamp), body]), // (timestamp + body)
    )
    if (!valid) {
      return c.json({error: 'Bad request signature'}, {status: 401})
    }

    // handle
    return c.json(await handler(data))
  })
}

const app = new Hono()
app.use(logger())

app.post('/discord/interactions', interactionHono(publicKey, interaction))

if (Deno.env.has('KEY') && Deno.env.has('CERT')) {
  const key = Deno.readTextFileSync(Deno.env.get('KEY')!)
  const cert = Deno.readTextFileSync(Deno.env.get('CERT')!)
  Deno.serve({port: 443, key, cert}, app.fetch)
} else {
  Deno.serve({port: 80}, app.fetch)
}
