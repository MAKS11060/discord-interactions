import type {DiscordInteractionsApp} from '#app'
import {importPublicKey} from '#lib/crypto.ts'
import {concat} from '@std/bytes/concat'
import type {APIInteraction} from 'discord-api-types/v10'
import {createMiddleware} from 'hono/factory'
import {InteractionError} from '../core/errors.ts'
import {
  ERROR_BadRequestSignature,
  ERROR_ExecuteFailed,
  ERROR_MethodNotAllowed,
  HEADER_SIGNATURE,
  HEADER_SIGNATURE_TS,
  publicKeyCache,
} from './_common.ts'

const encoder = new TextEncoder()

/**
 * @example
 * ```ts
 * const discordApp = new DiscordInteraction({
 *   publicKey: process.env.CLIENT_PUBLIC_KEY!,
 * })
 *
 * const app = new Hono()
 * app.post('/api/interactions', interactionHandler(discordApp))
 * ```
 */
export const interactionHandler = (app: DiscordInteractionsApp) => {
  return createMiddleware(async (c, next) => {
    if (c.req.method !== 'POST') {
      return c.json(ERROR_MethodNotAllowed, {status: 405})
    }

    // verify
    const signature = c.req.header(HEADER_SIGNATURE)
    const timestamp = c.req.header(HEADER_SIGNATURE_TS)
    if (!signature || !timestamp) {
      return c.json(ERROR_BadRequestSignature, {status: 401})
    }

    const publicKey = publicKeyCache.getOrInsert(
      app,
      typeof app.client.publicKey === 'string'
        ? await importPublicKey(app.client.publicKey)
        : app.client.publicKey,
    )

    const valid = await crypto.subtle.verify(
      publicKey.algorithm,
      publicKey,
      Uint8Array.fromHex(signature),
      concat([encoder.encode(timestamp), await c.req.bytes()]), // (timestamp + body)
    )
    if (!valid) {
      return c.json(ERROR_BadRequestSignature, {status: 401})
    }

    // execute
    try {
      return c.json(
        await app.execute(
          await c.req.json<APIInteraction>(),
        ) as any, // hono can't forward a large type
      )
    } catch (e) {
      if (e instanceof InteractionError) return c.json({error: e.name, message: e.message}, {status: e.status})
      return c.json(ERROR_ExecuteFailed, {status: 500})
    }
  })
}
