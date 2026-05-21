import type {DiscordInteractionsApp} from '#app'
import {importPublicKey} from '#lib/crypto.ts'
import {concat} from '@std/bytes/concat'
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
    return Response.json(ERROR_MethodNotAllowed, {status: 405})
  }

  // verify
  const signature = request.headers.get(HEADER_SIGNATURE)
  const timestamp = request.headers.get(HEADER_SIGNATURE_TS)
  if (signature === null || timestamp === null) {
    return Response.json(ERROR_BadRequestSignature, {status: 401})
  }

  const body = await request.clone().bytes()

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
    concat([encoder.encode(timestamp), body]), // (timestamp + body)
  )
  if (!valid) {
    return Response.json(ERROR_BadRequestSignature, {status: 401})
  }

  // execute
  try {
    return Response.json(
      await app.execute(
        await request.json(),
      ),
    )
  } catch (e) {
    if (e instanceof InteractionError) return Response.json({error: e.name, message: e.message}, {status: e.status})
    return Response.json(ERROR_ExecuteFailed, {status: 500})
  }
}
