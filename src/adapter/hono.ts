import {verifyRequestSignature} from '#lib/crypto.ts'
import {concat} from '@std/bytes/concat'
import type {APIInteraction, APIPingInteraction} from 'discord-api-types/v10'
import {createMiddleware} from 'hono/factory'
import type {InteractionHandler} from '../core/types.ts'

const encoder = new TextEncoder()

/**
 * @example
 * ```ts
 * import {Hono} from 'hono'
 *
 * const app = new Hono()
 * app.use(logger())
 *
 * const discordApp = new DiscordInteractions()
 *
 * app.post('/api/interactions', interactionHandler(app))
 * ```
 */
export const interactionHono = (
  publicKey:
    | CryptoKey
    | Record<string, CryptoKey>
    | (({application_id}: APIPingInteraction) => Promise<CryptoKey>),
  handler: InteractionHandler,
) => {
  if (publicKey instanceof CryptoKey) {
    return createMiddleware(async (c, next) => {
      const isInvalidRequest = await verifyRequestSignature(c.req.raw, publicKey)
      if (isInvalidRequest) return isInvalidRequest
      // await next() // ok

      const data = await c.req.json<APIInteraction>()
      return c.json(await handler.execute(data))
    })
  }

  if (typeof publicKey === 'function') {
    throw new Error('TODO')
    return createMiddleware(async (c, next) => {
    })
  }

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

    const key = publicKey[data.application_id]!
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
    return c.json(await handler.execute(data))
  })
}
