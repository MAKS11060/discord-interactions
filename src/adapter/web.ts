import {importPublicKey} from '#lib/crypto.ts'
import {concat} from '@std/bytes/concat'
import {InteractionError} from '../core/errors.ts'
import type {DiscordInteractionsApp} from '#app'

const encoder = new TextEncoder()
const publicKeyCache = new WeakMap()

/**
 * @example
 * ```ts
 * const app = new DiscordInteractions()
 *
 * Deno.serve(async (req) => {
 *   const url = new URL(req.url)
 *
 *   if (req.method === 'POST' && url.pathname === '/api/interactions') {
 *     return await interactionHandler(req, app)
 *   }
 *
 *   return Response.json('Not Found')
 * })
 * ```
 */
export const interactionHandler = async (
  request: Request,
  app: DiscordInteractionsApp,
): Promise<Response> => {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method Not Allowed'}, {status: 405})
  }

  const signature = request.headers.get('X-Signature-Ed25519')
  const timestamp = request.headers.get('X-Signature-Timestamp')
  if (signature === null || timestamp === null) {
    return Response.json({error: 'Bad request signature'}, {status: 401})
  }

  const body = await request.clone().bytes()

  const publicKey = publicKeyCache.getOrInsert(
    app,
    typeof app.publicKey === 'string'
      ? await importPublicKey(app.publicKey)
      : app.publicKey,
  )

  const valid = await crypto.subtle.verify(
    publicKey.algorithm,
    publicKey,
    Uint8Array.fromHex(signature),
    concat([encoder.encode(timestamp), body]), // (timestamp + body)
  )
  if (!valid) {
    return Response.json({error: 'Bad request signature'}, {status: 401})
  }

  try {
    return Response.json(
      app.execute(
        await request.json(),
      ),
    )
  } catch (e) {
    if (e instanceof InteractionError) return Response.json({error: e.name, message: e.message}, {status: e.status})
    return Response.json({error: 'Failed to execute handler'}, {status: 500})
  }
}
